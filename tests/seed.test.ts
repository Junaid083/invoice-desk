import { describe, expect, it } from "vitest";
import { invoicesCollection } from "@/lib/collections";
import { SEED_IDS } from "@/lib/seed";
import { STATUSES, canTransition, isFinal } from "@/lib/status";
import { setupSeededDb } from "./helpers";

setupSeededDb();

describe("seed data", () => {
  it("inserts six invoices covering every status", async () => {
    const docs = await (await invoicesCollection()).find().toArray();
    expect(docs).toHaveLength(6);
    expect(new Set(docs.map((d) => d.status))).toEqual(new Set(STATUSES));
  });

  it("flags the repeated SL-0583 as a duplicate of the first one", async () => {
    const col = await invoicesCollection();
    const dup = await col.findOne({ duplicateOfId: { $ne: null } });
    expect(dup?._id.toHexString()).toBe(SEED_IDS.summitDuplicate);
    expect(dup?.duplicateOfId?.toHexString()).toBe(SEED_IDS.summitOriginal);
    expect(dup).toMatchObject({ status: "NEEDS_REVIEW", reviewReason: "Possible duplicate" });
  });

  it("builds a history that follows the status rules", async () => {
    const docs = await (await invoicesCollection()).find().toArray();
    for (const doc of docs) {
      expect(doc.history[0].fromStatus).toBeNull();
      for (const ev of doc.history.slice(1)) {
        expect(canTransition(ev.fromStatus!, ev.toStatus), doc.invoiceNumber).toBe(true);
      }
      expect(doc.history.at(-1)!.toStatus).toBe(doc.status);
      expect(doc.decidedAt !== null).toBe(isFinal(doc.status));
    }
  });

  it("keeps the same ids on every reseed", async () => {
    const ids = (await (await invoicesCollection()).find().toArray()).map((d) => d._id.toHexString());
    expect(ids.sort()).toEqual(Object.values(SEED_IDS).sort());
  });

  it("has a database validator that rejects bad documents", async () => {
    const col = await invoicesCollection();
    // @ts-expect-error deliberately invalid document
    await expect(col.insertOne({ status: "PAID" })).rejects.toThrow(/Document failed validation/);
  });
});
