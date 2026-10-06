import { InvoiceTabs } from "@/components/invoice-tabs";
import { isTabKey } from "@/lib/status";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { tab } = await searchParams;
  const initialTab = typeof tab === "string" && isTabKey(tab) ? tab : "processing";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Review incoming invoices and approve or reject them.
        </p>
      </div>
      <InvoiceTabs initialTab={initialTab} />
    </main>
  );
}
