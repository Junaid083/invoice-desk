import { NextRequest, NextResponse } from "next/server";
import { invoicesCollection } from "@/lib/collections";
import { toInvoiceDTO } from "@/lib/serializers";
import { isStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("status");
  const requested = param
    ? param.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    : [];

  const invalid = requested.filter((s) => !isStatus(s));
  if (invalid.length) {
    return NextResponse.json({ error: `Unknown status: ${invalid.join(", ")}` }, { status: 400 });
  }
  const statuses = requested.filter(isStatus);

  try {
    const col = await invoicesCollection();
    const docs = await col
      .find(statuses.length ? { status: { $in: statuses } } : {}, { projection: { history: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ data: docs.map(toInvoiceDTO) });
  } catch (err) {
    console.error("GET /api/invoices failed", err);
    return NextResponse.json({ error: "Could not load invoices" }, { status: 500 });
  }
}
