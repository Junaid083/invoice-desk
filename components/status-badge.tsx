import { cn } from "@/lib/utils";
import { STATUS_LABELS, type InvoiceStatus } from "@/lib/status";

export const STATUS_STYLES: Record<InvoiceStatus, { badge: string; dot: string }> = {
  PROCESSING: {
    badge: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30",
    dot: "bg-sky-500",
  },
  NEEDS_REVIEW: {
    badge: "bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30",
    dot: "bg-amber-500",
  },
  APPROVED: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status as InvoiceStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        style?.badge ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", style?.dot ?? "bg-muted-foreground")} />
      {STATUS_LABELS[status as InvoiceStatus] ?? status}
    </span>
  );
}
