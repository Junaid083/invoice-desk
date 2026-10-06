import { NextRequest, NextResponse } from "next/server";
import { invoicesCollection } from "@/lib/collections";
import { toObjectId } from "@/lib/mongodb";
import { summaryProjection, toInvoiceDetailDTO, type InvoiceSummaryDoc } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  try {
    const col = await invoicesCollection();
    const doc = await col.findOne({ _id });
    if (!doc) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const [original, duplicates] = await Promise.all([
      doc.duplicateOfId
        ? col.findOne<InvoiceSummaryDoc>({ _id: doc.duplicateOfId }, { projection: summaryProjection })
        : null,
      col
        .find<InvoiceSummaryDoc>({ duplicateOfId: _id }, { projection: summaryProjection })
        .sort({ createdAt: 1 })
        .toArray(),
    ]);

    return NextResponse.json({ data: toInvoiceDetailDTO(doc, original, duplicates) });
  } catch (err) {
    console.error(`GET /api/invoices/${id} failed`, err);
    return NextResponse.json({ error: "Could not load invoice" }, { status: 500 });
  }
}
