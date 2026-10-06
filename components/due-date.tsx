import { cn } from "@/lib/utils";
import { daysUntil, formatDate } from "@/lib/format";

export function DueDate({ value, open }: { value: string; open: boolean }) {
  const days = daysUntil(value);

  let hint: { text: string; className: string } | null = null;
  if (open && days < 0) {
    hint = { text: `${-days}d overdue`, className: "text-rose-600 dark:text-rose-400" };
  } else if (open && days === 0) {
    hint = { text: "Due today", className: "text-amber-700 dark:text-amber-400" };
  } else if (open && days <= 7) {
    hint = { text: `In ${days}d`, className: "text-muted-foreground" };
  }

  return (
    <span className="flex flex-col leading-tight">
      <span>{formatDate(value)}</span>
      {hint && <span className={cn("text-xs font-medium", hint.className)}>{hint.text}</span>}
    </span>
  );
}
