import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { invoicesCollection } from "@/lib/collections";
import { toObjectId } from "@/lib/mongodb";
import { toInvoiceDTO } from "@/lib/serializers";
import { canTransition, isFinal, STATUS_UPDATES } from "@/lib/status";

export const dynamic = "force-dynamic";

const Body = z.object({
  status: z.enum(STATUS_UPDATES),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Body must be { status: NEEDS_REVIEW | APPROVED | REJECTED, note?: string }" },
      { status: 400 }
    );
  }

  const { status } = parsed.data;
  const note = parsed.data.note || null;
  if (status === "REJECTED" && !note) {
    return NextResponse.json({ error: "A reason is required to reject" }, { status: 400 });
  }

  try {
    const col = await invoicesCollection();

    const current = await col.findOne({ _id }, { projection: { status: 1 } });
    if (!current) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const from = current.status;
    if (!canTransition(from, status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${from} to ${status}` },
        { status: 409 }
      );
    }

    const now = new Date();
    const updated = await col.findOneAndUpdate(
      { _id, status: from },
      {
        $set: {
          status,
          decidedAt: isFinal(status) ? now : null,
          updatedAt: now,
          ...(status === "NEEDS_REVIEW" ? { reviewReason: note ?? "Flagged for review" } : {}),
        },
        $push: {
          history: { _id: new ObjectId(), fromStatus: from, toStatus: status, note, createdAt: now },
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Invoice was updated by someone else. Refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({ data: toInvoiceDTO(updated) });
  } catch (err) {
    console.error(`PATCH /api/invoices/${id}/status failed`, err);
    return NextResponse.json({ error: "Could not update invoice" }, { status: 500 });
  }
}
