"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleCheck, CircleX, Hourglass, Search, TriangleAlert, type LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceTable } from "@/components/invoice-table";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { TABS, TAB_KEYS, isTabKey, type TabKey } from "@/lib/status";
import type { Invoice } from "@/lib/types";
import { errorMessage } from "@/services/api-client";
import { invoiceService } from "@/services/invoice.service";

const EMPTY_TEXT: Record<TabKey, string> = {
  processing: "New invoices will show up here as they arrive.",
  review: "No invoices are waiting on a closer look.",
  decided: "Approved and rejected invoices will be listed here.",
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function sum(invoices: Invoice[]) {
  return invoices.reduce((total, inv) => total + inv.amountCents, 0);
}

export function InvoiceTabs({ initialTab }: { initialTab: TabKey }) {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [query, setQuery] = useState("");

  useEffect(() => {
    invoiceService
      .list()
      .then(setInvoices)
      .catch((err) => setError(errorMessage(err, "Could not load invoices")));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!invoices || !q) return invoices ?? [];
    return invoices.filter((inv) =>
      [inv.vendorName, inv.invoiceNumber, inv.description].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [invoices, query]);

  function changeTab(value: string) {
    if (!isTabKey(value)) return;
    setTab(value);
    // Keep the tab in the URL so Back from a detail page lands on the same tab
    window.history.replaceState(null, "", value === "processing" ? "/" : `/?tab=${value}`);
  }

  if (error) {
    return (
      <Card className="items-center gap-2 py-12 text-center">
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }
  if (!invoices) return <ListSkeleton />;

  const byStatus = (...statuses: Invoice["status"][]) =>
    invoices.filter((inv) => statuses.includes(inv.status));
  const open = byStatus("PROCESSING", "NEEDS_REVIEW");
  const review = byStatus("NEEDS_REVIEW");
  const approved = byStatus("APPROVED");
  const rejected = byStatus("REJECTED");

  const inTab = (key: TabKey) =>
    filtered.filter((inv) => (TABS[key].statuses as readonly string[]).includes(inv.status));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Hourglass}
          label="Awaiting decision"
          value={formatMoney(sum(open))}
          detail={plural(open.length, "invoice")}
          tone="sky"
        />
        <StatCard
          icon={TriangleAlert}
          label="Needs review"
          value={String(review.length)}
          detail={plural(review.filter((inv) => inv.duplicateOfId).length, "possible duplicate")}
          tone="amber"
        />
        <StatCard
          icon={CircleCheck}
          label="Approved"
          value={formatMoney(sum(approved))}
          detail={plural(approved.length, "invoice")}
          tone="emerald"
        />
        <StatCard
          icon={CircleX}
          label="Rejected"
          value={formatMoney(sum(rejected))}
          detail={plural(rejected.length, "invoice")}
          tone="rose"
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <Tabs value={tab} onValueChange={changeTab} className="gap-0">
          <div className="flex flex-col gap-3 border-b px-4 pt-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
              <TabsList variant="line" className="h-auto gap-4 p-0">
                {TAB_KEYS.map((key) => {
                  const count = inTab(key).length;
                  return (
                    <TabsTrigger key={key} value={key} className="flex-none px-0 pb-3">
                      {TABS[key].label}
                      <span
                        className={cn(
                          "min-w-5 rounded-full px-1.5 text-xs tabular-nums",
                          key === "review" && count > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            <div className="relative pb-3 sm:w-64">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vendor or invoice no."
                aria-label="Search invoices"
                className="pl-8"
              />
            </div>
          </div>
          {TAB_KEYS.map((key) => (
            <TabsContent key={key} value={key}>
              <InvoiceTable
                invoices={inTab(key)}
                emptyText={query.trim() ? `No invoices match "${query.trim()}".` : EMPTY_TEXT[key]}
              />
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}

const TONES = {
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: keyof typeof TONES;
}) {
  return (
    <Card className="gap-3 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("flex size-7 items-center justify-center rounded-md", TONES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <div>
        <p className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading invoices">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[106px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
