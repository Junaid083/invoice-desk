import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import { STATUS_STYLES } from "@/components/status-badge";
import type { StatusEvent } from "@/lib/types";

function eventTitle(ev: StatusEvent) {
  if (!ev.fromStatus) {
    return ev.toStatus === "PROCESSING" ? "Invoice received" : `Received as ${STATUS_LABELS[ev.toStatus].toLowerCase()}`;
  }
  switch (ev.toStatus) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "NEEDS_REVIEW":
      return "Flagged for review";
    default:
      return `Moved to ${STATUS_LABELS[ev.toStatus].toLowerCase()}`;
  }
}

export function StatusTimeline({ events }: { events: StatusEvent[] }) {
  const newestFirst = [...events].reverse();

  return (
    <ol className="relative">
      {newestFirst.map((ev, i) => (
        <li key={ev.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < newestFirst.length - 1 && (
            <span aria-hidden className="absolute top-4 left-[5px] h-full w-px bg-border" />
          )}
          <span
            aria-hidden
            className={cn(
              "relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-card",
              STATUS_STYLES[ev.toStatus].dot
            )}
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm leading-tight font-medium">{eventTitle(ev)}</p>
            <p className="text-xs text-muted-foreground">
              <time dateTime={ev.createdAt}>{formatDateTime(ev.createdAt)}</time>
              {ev.fromStatus && (
                <>
                  {" · "}
                  {STATUS_LABELS[ev.fromStatus]} → {STATUS_LABELS[ev.toStatus]}
                </>
              )}
            </p>
            {ev.note && (
              <p className="rounded-md bg-muted px-2.5 py-1.5 text-sm text-foreground/80">{ev.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
