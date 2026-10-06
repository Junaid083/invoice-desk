import type { InvoiceStatus } from "./status";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  amountCents: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  description: string;
  status: InvoiceStatus;
  reviewReason: string | null;
  duplicateOfId: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StatusEvent = {
  id: string;
  fromStatus: InvoiceStatus | null;
  toStatus: InvoiceStatus;
  note: string | null;
  createdAt: string;
};

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  amountCents: number;
  currency: string;
  issueDate: string;
  status: InvoiceStatus;
};

export type InvoiceWithHistory = Invoice & {
  history: StatusEvent[];
  duplicateOf: InvoiceSummary | null;
  duplicates: InvoiceSummary[];
};
