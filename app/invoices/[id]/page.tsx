import type { Metadata } from "next";
import { InvoiceDetail } from "@/components/invoice-detail";
import { invoicesCollection } from "@/lib/collections";
import { toObjectId } from "@/lib/mongodb";

export async function generateMetadata({ params }: PageProps<"/invoices/[id]">): Promise<Metadata> {
  const _id = toObjectId((await params).id);
  if (!_id) return { title: "Invoice not found" };

  try {
    const col = await invoicesCollection();
    const doc = await col.findOne({ _id }, { projection: { invoiceNumber: 1 } });
    return { title: doc ? doc.invoiceNumber : "Invoice not found" };
  } catch {
    return { title: "Invoice" };
  }
}

export default async function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <InvoiceDetail key={id} id={id} />
    </main>
  );
}
