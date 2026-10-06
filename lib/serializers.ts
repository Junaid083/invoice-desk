import type { InvoiceDoc, StatusEventDoc } from "./models";
import type { Invoice, InvoiceSummary, InvoiceWithHistory, StatusEvent } from "./types";

export function toInvoiceDTO(doc: InvoiceDoc): Invoice {
  return {
    id: doc._id.toHexString(),
    invoiceNumber: doc.invoiceNumber,
    vendorName: doc.vendorName,
    amountCents: doc.amountCents,
    currency: doc.currency,
    issueDate: doc.issueDate.toISOString(),
    dueDate: doc.dueDate.toISOString(),
    description: doc.description,
    status: doc.status,
    reviewReason: doc.reviewReason,
    duplicateOfId: doc.duplicateOfId ? doc.duplicateOfId.toHexString() : null,
    decidedAt: doc.decidedAt ? doc.decidedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toStatusEventDTO(event: StatusEventDoc): StatusEvent {
  return {
    id: event._id.toHexString(),
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    note: event.note,
    createdAt: event.createdAt.toISOString(),
  };
}

export type InvoiceSummaryDoc = Pick<
  InvoiceDoc,
  "_id" | "invoiceNumber" | "vendorName" | "amountCents" | "currency" | "issueDate" | "status"
>;

export const summaryProjection = {
  invoiceNumber: 1,
  vendorName: 1,
  amountCents: 1,
  currency: 1,
  issueDate: 1,
  status: 1,
} as const;

function toInvoiceSummaryDTO(doc: InvoiceSummaryDoc): InvoiceSummary {
  return {
    id: doc._id.toHexString(),
    invoiceNumber: doc.invoiceNumber,
    vendorName: doc.vendorName,
    amountCents: doc.amountCents,
    currency: doc.currency,
    issueDate: doc.issueDate.toISOString(),
    status: doc.status,
  };
}

export function toInvoiceDetailDTO(
  doc: InvoiceDoc,
  original: InvoiceSummaryDoc | null,
  duplicates: InvoiceSummaryDoc[]
): InvoiceWithHistory {
  return {
    ...toInvoiceDTO(doc),
    history: doc.history.map(toStatusEventDTO),
    duplicateOf: original ? toInvoiceSummaryDTO(original) : null,
    duplicates: duplicates.map(toInvoiceSummaryDTO),
  };
}
