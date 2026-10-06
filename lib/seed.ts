import { ObjectId, type Db } from "mongodb";
import { INVOICES, ensureInvoicesCollection } from "./collections";
import type { InvoiceDoc, StatusEventDoc } from "./models";
import { canTransition, isFinal, type InvoiceStatus, type StatusUpdate } from "./status";

// Fixed ids, so links to sample invoices keep working after a reseed
export const SEED_IDS = {
  readyMix: "6701c2a9f1b2c3d4e5f60001",
  brightLine: "6701c2a9f1b2c3d4e5f60002",
  summitOriginal: "6701c2a9f1b2c3d4e5f60003",
  valleyPlumbing: "6701c2a9f1b2c3d4e5f60004",
  summitDuplicate: "6701c2a9f1b2c3d4e5f60005",
  desertRentals: "6701c2a9f1b2c3d4e5f60006",
} as const;

type SeedInvoice = {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  amountCents: number;
  issueDate: Date;
  dueDate: Date;
  description: string;
  /** Status changes a reviewer made after the invoice arrived */
  steps?: { status: StatusUpdate; note: string }[];
};

// Dates are relative to today so the sample data never looks stale
function daysFromToday(days: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

function seedInvoices(): SeedInvoice[] {
  return [
    {
      id: SEED_IDS.readyMix,
      invoiceNumber: "RMC-1001",
      vendorName: "Ready Mix Concrete Co.",
      amountCents: 1_245_000,
      issueDate: daysFromToday(-33),
      dueDate: daysFromToday(-3),
      description: "40 yd³ 4000 PSI concrete, Lot 12 foundation pour",
    },
    {
      id: SEED_IDS.brightLine,
      invoiceNumber: "BLE-2207",
      vendorName: "BrightLine Electric",
      amountCents: 382_050,
      issueDate: daysFromToday(-30),
      dueDate: daysFromToday(0),
      description: "Rough-in wiring, units 1-4, Maple St. duplex",
      steps: [{ status: "NEEDS_REVIEW", note: "Billed 52 labor hours, timesheets show 44" }],
    },
    {
      id: SEED_IDS.summitOriginal,
      invoiceNumber: "SL-0583",
      vendorName: "Summit Lumber Supply",
      amountCents: 891_575,
      issueDate: daysFromToday(-28),
      dueDate: daysFromToday(2),
      description: "Framing package: 2x6 studs, LVL beams, OSB sheathing",
    },
    {
      id: SEED_IDS.valleyPlumbing,
      invoiceNumber: "VPD-3340",
      vendorName: "Valley Plumbing & Drain",
      amountCents: 214_000,
      issueDate: daysFromToday(-26),
      dueDate: daysFromToday(4),
      description: "Underground drain lines and inspection",
      steps: [
        { status: "NEEDS_REVIEW", note: "PO-118 not attached" },
        { status: "APPROVED", note: "PO-118 received, amounts match" },
      ],
    },
    {
      // Same vendor + invoice number as SL-0583 above: gets flagged as a duplicate
      id: SEED_IDS.summitDuplicate,
      invoiceNumber: "SL-0583",
      vendorName: "Summit Lumber Supply",
      amountCents: 891_575,
      issueDate: daysFromToday(-28),
      dueDate: daysFromToday(2),
      description: "Framing package: 2x6 studs, LVL beams, OSB sheathing",
    },
    {
      id: SEED_IDS.desertRentals,
      invoiceNumber: "DER-7712",
      vendorName: "Desert Equipment Rentals",
      amountCents: 167_500,
      issueDate: daysFromToday(-24),
      dueDate: daysFromToday(-10),
      description: "Mini excavator rental, 3 days",
      steps: [{ status: "REJECTED", note: "Billed 3 days, rental log shows 2" }],
    },
  ];
}

/** Drops the invoices collection and recreates it with the sample data. */
export async function seedDatabase(db: Db) {
  const exists = await db.listCollections({ name: INVOICES }, { nameOnly: true }).hasNext();
  if (exists) await db.collection(INVOICES).drop();
  await ensureInvoicesCollection(db);

  const col = db.collection<InvoiceDoc>(INVOICES);
  const invoices = seedInvoices();

  for (const [index, inv] of invoices.entries()) {
    // An hour apart so "newest first" is stable; each later change 25 minutes after the last
    const createdAt = new Date(Date.now() - (invoices.length - index) * 60 * 60_000);
    let at = createdAt;

    const original = await col.findOne({ vendorName: inv.vendorName, invoiceNumber: inv.invoiceNumber });

    let status: InvoiceStatus = original ? "NEEDS_REVIEW" : "PROCESSING";
    let reviewReason: string | null = original ? "Possible duplicate" : null;
    const history: StatusEventDoc[] = [
      {
        _id: new ObjectId(),
        fromStatus: null,
        toStatus: status,
        note: original ? `Auto-flagged: same vendor and invoice number as ${original.invoiceNumber}` : "Received",
        createdAt,
      },
    ];

    for (const step of inv.steps ?? []) {
      if (!canTransition(status, step.status)) {
        throw new Error(`Seed ${inv.invoiceNumber}: cannot go from ${status} to ${step.status}`);
      }
      at = new Date(at.getTime() + 25 * 60_000);
      history.push({ _id: new ObjectId(), fromStatus: status, toStatus: step.status, note: step.note, createdAt: at });
      if (step.status === "NEEDS_REVIEW") reviewReason = step.note;
      status = step.status;
    }

    await col.insertOne({
      _id: new ObjectId(inv.id),
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorName,
      amountCents: inv.amountCents,
      currency: "USD",
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      description: inv.description,
      status,
      reviewReason,
      duplicateOfId: original ? original._id : null,
      decidedAt: isFinal(status) ? at : null,
      history,
      createdAt,
      updatedAt: at,
    });
  }

  return invoices.length;
}
