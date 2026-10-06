import type { Collection, Db } from "mongodb";
import { getDb } from "./mongodb";
import { STATUSES } from "./status";
import type { InvoiceDoc } from "./models";

export const INVOICES = "invoices";

export async function invoicesCollection(): Promise<Collection<InvoiceDoc>> {
  const db = await getDb();
  return db.collection<InvoiceDoc>(INVOICES);
}

const statusEnum = [...STATUSES];

export const invoiceValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "invoiceNumber", "vendorName", "amountCents", "currency", "issueDate", "dueDate",
      "description", "status", "history", "createdAt", "updatedAt",
    ],
    properties: {
      invoiceNumber: { bsonType: "string", minLength: 1 },
      vendorName: { bsonType: "string", minLength: 1 },
      amountCents: { bsonType: ["int", "long"], minimum: 0 },
      currency: { bsonType: "string", minLength: 3, maxLength: 3 },
      issueDate: { bsonType: "date" },
      dueDate: { bsonType: "date" },
      description: { bsonType: "string" },
      status: { enum: statusEnum },
      reviewReason: { bsonType: ["string", "null"] },
      duplicateOfId: { bsonType: ["objectId", "null"] },
      decidedAt: { bsonType: ["date", "null"] },
      history: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["_id", "toStatus", "createdAt"],
          properties: {
            _id: { bsonType: "objectId" },
            fromStatus: { enum: [...statusEnum, null] },
            toStatus: { enum: statusEnum },
            note: { bsonType: ["string", "null"] },
            createdAt: { bsonType: "date" },
          },
        },
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

export async function ensureInvoicesCollection(db: Db) {
  const exists = await db.listCollections({ name: INVOICES }, { nameOnly: true }).hasNext();

  if (exists) {
    await db.command({ collMod: INVOICES, validator: invoiceValidator, validationLevel: "strict" });
  } else {
    await db.createCollection(INVOICES, { validator: invoiceValidator, validationLevel: "strict" });
  }

  await db.collection(INVOICES).createIndexes([
    { key: { status: 1, createdAt: -1 }, name: "status_createdAt" },
    { key: { vendorName: 1, invoiceNumber: 1 }, name: "vendor_invoiceNumber" },
    { key: { duplicateOfId: 1 }, name: "duplicateOfId", sparse: true },
  ]);
}
