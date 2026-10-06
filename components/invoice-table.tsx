"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Copy, Inbox } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { VendorAvatar } from "@/components/vendor-avatar";
import { DueDate } from "@/components/due-date";
import { formatDate, formatMoney } from "@/lib/format";
import { isFinal } from "@/lib/status";
import type { Invoice } from "@/lib/types";

export function InvoiceTable({ invoices, emptyText }: { invoices: Invoice[]; emptyText: string }) {
  const router = useRouter();

  if (!invoices.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-5 text-muted-foreground" />
        </span>
        <p className="text-sm font-medium">Nothing here</p>
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Vendor</TableHead>
          <TableHead className="hidden sm:table-cell">Invoice</TableHead>
          <TableHead className="hidden md:table-cell">Issued</TableHead>
          <TableHead className="hidden sm:table-cell">Due</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden w-8 pr-4 sm:table-cell" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => {
          const href = `/invoices/${inv.id}`;
          return (
            <TableRow
              key={inv.id}
              className="group cursor-pointer"
              onClick={() => router.push(href)}
            >
              <TableCell className="py-3 pl-4 whitespace-normal">
                <div className="flex items-center gap-3">
                  <VendorAvatar name={inv.vendorName} />
                  <div className="min-w-0">
                    <p className="font-medium">{inv.vendorName}</p>
                    <p className="font-mono text-xs text-muted-foreground sm:hidden">
                      {inv.invoiceNumber}
                      {inv.duplicateOfId && <span className="ml-1.5 font-sans text-amber-700">· Duplicate?</span>}
                    </p>
                    <p className="hidden max-w-xs truncate text-xs text-muted-foreground lg:block">
                      {inv.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex flex-col items-start gap-1">
                  <Link
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-[13px] font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                  >
                    {inv.invoiceNumber}
                  </Link>
                  {inv.duplicateOfId && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Copy className="size-3" />
                      Possible duplicate
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatDate(inv.issueDate)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <DueDate value={inv.dueDate} open={!isFinal(inv.status)} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(inv.amountCents, inv.currency)}
              </TableCell>
              <TableCell>
                <StatusBadge status={inv.status} />
              </TableCell>
              <TableCell className="hidden pr-4 sm:table-cell">
                <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
