import { describe, expect, it } from "vitest";
import { SEED_IDS } from "@/lib/seed";
import { api, setupSeededDb } from "./helpers";

setupSeededDb();

const MISSING_ID = "000000000000000000000000";

describe("GET /api/invoices", () => {
  it("lists every invoice, newest first, without history", async () => {
    const { status, body } = await api.list();
    expect(status).toBe(200);
    expect(body.data).toHaveLength(6);
    expect(body.data[0].id).toBe(SEED_IDS.desertRentals);
    expect(body.data[0]).not.toHaveProperty("history");
  });

  it("filters by one or more statuses", async () => {
    const review = await api.list("?status=NEEDS_REVIEW");
    expect(review.body.data.map((i: { id: string }) => i.id).sort()).toEqual(
      [SEED_IDS.brightLine, SEED_IDS.summitDuplicate].sort()
    );

    const decided = await api.list("?status=approved,rejected");
    expect(decided.body.data).toHaveLength(2);
  });

  it("rejects an unknown status with 400", async () => {
    const { status, body } = await api.list("?status=PAID");
    expect(status).toBe(400);
    expect(body.error).toBe("Unknown status: PAID");
  });
});

describe("GET /api/invoices/:id", () => {
  it("returns the invoice with its history and a link to the original", async () => {
    const { status, body } = await api.get(SEED_IDS.summitDuplicate);
    expect(status).toBe(200);
    expect(body.data.history).toHaveLength(1);
    expect(body.data.duplicateOf).toMatchObject({ id: SEED_IDS.summitOriginal, invoiceNumber: "SL-0583" });
    expect(body.data.duplicates).toEqual([]);
  });

  it("links the original back to its duplicates", async () => {
    const { body } = await api.get(SEED_IDS.summitOriginal);
    expect(body.data.duplicateOf).toBeNull();
    expect(body.data.duplicates.map((d: { id: string }) => d.id)).toEqual([SEED_IDS.summitDuplicate]);
  });

  it("returns 404 for a malformed or unknown id", async () => {
    expect((await api.get("not-an-id")).status).toBe(404);
    expect((await api.get(MISSING_ID)).status).toBe(404);
  });
});

describe("PATCH /api/invoices/:id/status", () => {
  it("approves an invoice, records history and persists it", async () => {
    const { status, body } = await api.patch(SEED_IDS.readyMix, { status: "APPROVED", note: "Matches PO" });
    expect(status).toBe(200);
    expect(body.data.status).toBe("APPROVED");
    expect(body.data.decidedAt).not.toBeNull();

    const detail = await api.get(SEED_IDS.readyMix);
    expect(detail.body.data.status).toBe("APPROVED");
    expect(detail.body.data.history.at(-1)).toMatchObject({
      fromStatus: "PROCESSING",
      toStatus: "APPROVED",
      note: "Matches PO",
    });
  });

  it("stores the note as the review reason when flagging", async () => {
    const { status, body } = await api.patch(SEED_IDS.readyMix, {
      status: "NEEDS_REVIEW",
      note: "Delivery ticket missing",
    });
    expect(status).toBe(200);
    expect(body.data).toMatchObject({ status: "NEEDS_REVIEW", reviewReason: "Delivery ticket missing", decidedAt: null });
  });

  it("requires a reason to reject", async () => {
    const { status, body } = await api.patch(SEED_IDS.readyMix, { status: "REJECTED", note: "   " });
    expect(status).toBe(400);
    expect(body.error).toBe("A reason is required to reject");
  });

  it("returns 409 when the invoice is already decided", async () => {
    const { status, body } = await api.patch(SEED_IDS.valleyPlumbing, { status: "REJECTED", note: "Too late" });
    expect(status).toBe(409);
    expect(body.error).toBe("Cannot change status from APPROVED to REJECTED");
  });

  it("returns 409 for a transition that is not allowed", async () => {
    const { status } = await api.patch(SEED_IDS.brightLine, { status: "NEEDS_REVIEW" });
    expect(status).toBe(409);
  });

  it("rejects an invalid body with 400", async () => {
    expect((await api.patch(SEED_IDS.readyMix, { status: "PROCESSING" })).status).toBe(400);
    expect((await api.patch(SEED_IDS.readyMix, "not json")).status).toBe(400);
    expect((await api.patch(SEED_IDS.readyMix, { status: "APPROVED", note: "x".repeat(501) })).status).toBe(400);
  });

  it("returns 404 for an unknown invoice", async () => {
    expect((await api.patch(MISSING_ID, { status: "APPROVED" })).status).toBe(404);
    expect((await api.patch("not-an-id", { status: "APPROVED" })).status).toBe(404);
  });

  it("lets only one of two simultaneous decisions win", async () => {
    const results = await Promise.all([
      api.patch(SEED_IDS.readyMix, { status: "APPROVED" }),
      api.patch(SEED_IDS.readyMix, { status: "REJECTED", note: "Duplicate" }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);

    const detail = await api.get(SEED_IDS.readyMix);
    expect(detail.body.data.history).toHaveLength(2);
  });
});
