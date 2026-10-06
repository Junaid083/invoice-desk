export const STATUSES = ["PROCESSING", "NEEDS_REVIEW", "APPROVED", "REJECTED"] as const;
export type InvoiceStatus = (typeof STATUSES)[number];

export const TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  PROCESSING: ["NEEDS_REVIEW", "APPROVED", "REJECTED"],
  NEEDS_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export const STATUS_UPDATES = ["NEEDS_REVIEW", "APPROVED", "REJECTED"] as const;
export type StatusUpdate = (typeof STATUS_UPDATES)[number];

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  PROCESSING: "Processing",
  NEEDS_REVIEW: "Needs review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const FINAL_STATUSES: readonly InvoiceStatus[] = ["APPROVED", "REJECTED"];

export function isStatus(value: string): value is InvoiceStatus {
  return (STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: InvoiceStatus, to: InvoiceStatus) {
  return TRANSITIONS[from].includes(to);
}

export function isFinal(status: InvoiceStatus) {
  return FINAL_STATUSES.includes(status);
}

export const TABS = {
  processing: { label: "Processing", statuses: ["PROCESSING"] },
  review: { label: "Needs review", statuses: ["NEEDS_REVIEW"] },
  decided: { label: "Approved / Rejected", statuses: ["APPROVED", "REJECTED"] },
} as const satisfies Record<string, { label: string; statuses: readonly InvoiceStatus[] }>;

export type TabKey = keyof typeof TABS;
export const TAB_KEYS = Object.keys(TABS) as TabKey[];

export function isTabKey(value: string | undefined | null): value is TabKey {
  return !!value && value in TABS;
}

export function tabForStatus(status: InvoiceStatus): TabKey {
  return TAB_KEYS.find((key) => (TABS[key].statuses as readonly InvoiceStatus[]).includes(status))!;
}
