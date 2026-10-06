import { apiRequest } from "./api-client";
import type { InvoiceStatus, StatusUpdate } from "@/lib/status";
import type { Invoice, InvoiceWithHistory } from "@/lib/types";

export const invoiceService = {
  list(statuses: InvoiceStatus[] = []) {
    const query = statuses.length ? `?status=${statuses.join(",")}` : "";
    return apiRequest<Invoice[]>(`/api/invoices${query}`);
  },

  get(id: string) {
    return apiRequest<InvoiceWithHistory>(`/api/invoices/${encodeURIComponent(id)}`);
  },

  updateStatus(id: string, status: StatusUpdate, note?: string) {
    return apiRequest<Invoice>(`/api/invoices/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    });
  },
};
