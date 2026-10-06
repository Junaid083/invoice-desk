import type { ObjectId } from "mongodb";
import type { InvoiceStatus } from "./status";

export type StatusEventDoc = {
  _id: ObjectId;
  fromStatus: InvoiceStatus | null;
  toStatus: InvoiceStatus;
  note: string | null;
  createdAt: Date;
};

export type InvoiceDoc = {
  _id: ObjectId;
  invoiceNumber: string;
  vendorName: string;
  amountCents: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  description: string;
  status: InvoiceStatus;
  reviewReason: string | null;
  duplicateOfId: ObjectId | null;
  decidedAt: Date | null;
  history: StatusEventDoc[];
  createdAt: Date;
  updatedAt: Date;
};
