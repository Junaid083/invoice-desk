"use client";

import { useId, useState } from "react";
import { Check, Flag, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StatusUpdate } from "@/lib/status";

const CONFIG: Record<
  StatusUpdate,
  {
    trigger: string;
    title: string;
    description: string;
    noteLabel: string;
    placeholder: string;
    confirm: string;
    noteRequired: boolean;
    icon: LucideIcon;
    variant: "default" | "destructive" | "outline";
  }
> = {
  APPROVED: {
    trigger: "Approve",
    title: "Approve",
    description: "The invoice moves to Approved and can no longer be changed.",
    noteLabel: "Note (optional)",
    placeholder: "e.g. Matches PO-118",
    confirm: "Approve invoice",
    noteRequired: false,
    icon: Check,
    variant: "default",
  },
  REJECTED: {
    trigger: "Reject",
    title: "Reject",
    description: "The invoice moves to Rejected and can no longer be changed.",
    noteLabel: "Reason",
    placeholder: "e.g. Duplicate of SL-0583",
    confirm: "Reject invoice",
    noteRequired: true,
    icon: X,
    variant: "destructive",
  },
  NEEDS_REVIEW: {
    trigger: "Flag for review",
    title: "Flag",
    description: "The invoice moves to Needs review so someone can take a closer look.",
    noteLabel: "What needs checking?",
    placeholder: "e.g. Amount is higher than the PO",
    confirm: "Flag for review",
    noteRequired: true,
    icon: Flag,
    variant: "outline",
  },
};

export function DecisionDialog({
  decision,
  invoiceNumber,
  duplicateWarning,
  disabled,
  onConfirm,
  className,
}: {
  decision: StatusUpdate;
  invoiceNumber: string;
  duplicateWarning?: string;
  disabled?: boolean;
  /** Resolves true when the change was saved; the dialog then closes */
  onConfirm: (note: string | undefined) => Promise<boolean>;
  className?: string;
}) {
  const config = CONFIG[decision];
  const Icon = config.icon;
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const trimmed = note.trim();

  async function confirm() {
    setSaving(true);
    const saved = await onConfirm(trimmed || undefined);
    setSaving(false);
    if (saved) {
      setOpen(false);
      setNote("");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant={config.variant} disabled={disabled} className={className} />}
      >
        <Icon data-icon="inline-start" />
        {config.trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {config.title} {invoiceNumber}?
          </AlertDialogTitle>
          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>

        {decision === "APPROVED" && duplicateWarning && (
          <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{duplicateWarning}</p>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor={noteId}>{config.noteLabel}</Label>
          <Textarea
            id={noteId}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder={config.placeholder}
          />
          <p className="text-xs text-muted-foreground">Saved in the invoice history.</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <Button
            variant={config.variant === "outline" ? "default" : config.variant}
            disabled={saving || (config.noteRequired && !trimmed)}
            onClick={confirm}
          >
            {saving ? "Saving…" : config.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
