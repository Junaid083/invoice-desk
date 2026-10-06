"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Copy, FileText, Info } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { VendorAvatar } from "@/components/vendor-avatar";
import { DueDate } from "@/components/due-date";
import { DecisionDialog } from "@/components/decision-dialog";
import { cn } from "@/lib/utils";
import { canTransition, isFinal, STATUS_LABELS, TABS, tabForStatus, type StatusUpdate } from "@/lib/status";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import type { InvoiceSummary, InvoiceWithHistory } from "@/lib/types";
import { ApiError, errorMessage } from "@/services/api-client";
import { invoiceService } from "@/services/invoice.service";

const TOASTS: Record<StatusUpdate, string> = {
  APPROVED: "Invoice approved",
  REJECTED: "Invoice rejected",
  NEEDS_REVIEW: "Invoice flagged for review",
};

export function InvoiceDetail({ id }: { id: string }) {
  const [invoice, setInvoice] = useState<InvoiceWithHistory | null>(null);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);

  const load = useCallback(
    () =>
      invoiceService
        .get(id)
        .then(setInvoice)
        .catch((err) =>
          setError({
            message: errorMessage(err, "Could not load invoice"),
            notFound: err instanceof ApiError && err.status === 404,
          })
        ),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Once decided, point the reviewer at the oldest invoice still waiting
  const [nextId, setNextId] = useState<string | null>();
  const decided = invoice ? isFinal(invoice.status) : false;
  useEffect(() => {
    if (!decided) return;
    invoiceService
      .list(["PROCESSING", "NEEDS_REVIEW"])
      .then((open) => setNextId(open.at(-1)?.id ?? null))
      .catch(() => setNextId(null));
  }, [decided]);

  async function updateStatus(status: StatusUpdate, note?: string): Promise<boolean> {
    try {
      await invoiceService.updateStatus(id, status, note);
    } catch (err) {
      toast.error(errorMessage(err, "Could not update invoice"));
      // Someone else may have changed it; show the current state
      if (err instanceof ApiError && err.status === 409) await load();
      return false;
    }
    toast.success(TOASTS[status]);
    await load();
    return true;
  }

  if (error) return <LoadError {...error} />;
  if (!invoice) return <DetailSkeleton />;

  const backTab = tabForStatus(invoice.status);
  const lastEvent = invoice.history.at(-1);

  return (
    <div className="space-y-6">
      <Link
        href={backTab === "processing" ? "/" : `/?tab=${backTab}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {TABS[backTab].label.toLowerCase()}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <VendorAvatar name={invoice.vendorName} className="size-11 text-sm" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-semibold tracking-tight">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {invoice.vendorName} · Received {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-right">
          {formatMoney(invoice.amountCents, invoice.currency)}
        </p>
      </div>

      {invoice.duplicateOf && <DuplicateComparison invoice={invoice} original={invoice.duplicateOf} />}

      {invoice.duplicates.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            {invoice.duplicates.length === 1 ? "A later invoice was" : "Later invoices were"} flagged as a
            possible duplicate of this one:{" "}
            {invoice.duplicates.map((dup, i) => (
              <span key={dup.id}>
                {i > 0 && ", "}
                <Link href={`/invoices/${dup.id}`} className="font-medium underline underline-offset-4">
                  {dup.invoiceNumber}
                </Link>{" "}
                ({STATUS_LABELS[dup.status].toLowerCase()})
              </span>
            ))}
            .
          </p>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm sm:grid-cols-2">
              <Field label="Vendor">{invoice.vendorName}</Field>
              <Field label="Invoice number">
                <span className="font-mono">{invoice.invoiceNumber}</span>
              </Field>
              <Field label="Issue date">{formatDate(invoice.issueDate)}</Field>
              <Field label="Due date">
                <DueDate value={invoice.dueDate} open={!decided} />
              </Field>
              <Field label="Amount">
                <span className="tabular-nums">{formatMoney(invoice.amountCents, invoice.currency)}</span>
              </Field>
              <Field label="Currency">{invoice.currency}</Field>
              <Field label="Description" className="sm:col-span-2">
                {invoice.description}
              </Field>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {decided ? (
                <>
                  <div className="flex gap-3">
                    {invoice.status === "APPROVED" ? (
                      <CircleCheck className="size-5 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleX className="size-5 shrink-0 text-rose-600" />
                    )}
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {STATUS_LABELS[invoice.status]}
                        {invoice.decidedAt && ` on ${formatDateTime(invoice.decidedAt)}`}
                      </p>
                      {lastEvent?.note && <p className="text-muted-foreground">{lastEvent.note}</p>}
                      <p className="text-xs text-muted-foreground">This decision is final.</p>
                    </div>
                  </div>
                  {nextId && (
                    <Link href={`/invoices/${nextId}`} className={buttonVariants({ className: "w-full" })}>
                      Next invoice
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  )}
                  {nextId === null && (
                    <p className="text-sm text-muted-foreground">No other invoices are waiting. All caught up.</p>
                  )}
                </>
              ) : (
                <>
                  {invoice.status === "NEEDS_REVIEW" && invoice.reviewReason ? (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm dark:bg-amber-500/10">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Why it needs review</p>
                      <p className="text-amber-950 dark:text-amber-100">{invoice.reviewReason}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">This invoice is waiting for a decision.</p>
                  )}
                  <div className="grid gap-2">
                    <DecisionDialog
                      decision="APPROVED"
                      invoiceNumber={invoice.invoiceNumber}
                      duplicateWarning={
                        invoice.duplicateOf
                          ? `This looks like a duplicate of ${invoice.duplicateOf.invoiceNumber} (${STATUS_LABELS[invoice.duplicateOf.status].toLowerCase()}). Approving both could pay the vendor twice.`
                          : undefined
                      }
                      onConfirm={(note) => updateStatus("APPROVED", note)}
                      className="w-full"
                    />
                    <DecisionDialog
                      decision="REJECTED"
                      invoiceNumber={invoice.invoiceNumber}
                      onConfirm={(note) => updateStatus("REJECTED", note)}
                      className="w-full"
                    />
                    {canTransition(invoice.status, "NEEDS_REVIEW") && (
                      <DecisionDialog
                        decision="NEEDS_REVIEW"
                        invoiceNumber={invoice.invoiceNumber}
                        onConfirm={(note) => updateStatus("NEEDS_REVIEW", note)}
                        className="w-full"
                      />
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline events={invoice.history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function DuplicateComparison({ invoice, original }: { invoice: InvoiceWithHistory; original: InvoiceSummary }) {
  const rows = [
    { label: "Vendor", current: invoice.vendorName, other: original.vendorName },
    { label: "Invoice no.", current: invoice.invoiceNumber, other: original.invoiceNumber },
    {
      label: "Amount",
      current: formatMoney(invoice.amountCents, invoice.currency),
      other: formatMoney(original.amountCents, original.currency),
    },
    { label: "Issued", current: formatDate(invoice.issueDate), other: formatDate(original.issueDate) },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/5">
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Copy className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="text-sm">
            <p className="font-medium text-amber-950 dark:text-amber-100">Possible duplicate</p>
            <p className="text-amber-900/80 dark:text-amber-200/80">
              Same vendor and invoice number as an invoice already on file. Check it before approving.
            </p>
          </div>
        </div>
        <Link
          href={`/invoices/${original.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 bg-background")}
        >
          <FileText data-icon="inline-start" />
          Open original
        </Link>
      </div>
      <Separator className="bg-amber-200 dark:bg-amber-500/30" />
      <div className="overflow-x-auto bg-background/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium" />
              <th className="px-4 py-2 font-medium">This invoice</th>
              <th className="px-4 py-2 font-medium">
                Original <StatusBadge status={original.status} className="ml-1" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const same = row.current === row.other;
              return (
                <tr key={row.label} className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">{row.label}</td>
                  <td className="px-4 py-2 font-medium tabular-nums">{row.current}</td>
                  <td className="px-4 py-2 tabular-nums">
                    <span className="font-medium">{row.other}</span>
                    {same && (
                      <span className="ml-2 text-xs font-medium text-amber-700 dark:text-amber-400">Same</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadError({ message, notFound }: { message: string; notFound: boolean }) {
  return (
    <Card className="mx-auto max-w-md items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted">
        <FileText className="size-5 text-muted-foreground" />
      </span>
      <div>
        <p className="font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">
          {notFound ? "It may have been removed, or the link is wrong." : "Please try again in a moment."}
        </p>
      </div>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        <ArrowLeft data-icon="inline-start" />
        Back to invoices
      </Link>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading invoice">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
