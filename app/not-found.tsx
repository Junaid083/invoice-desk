import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-6 text-muted-foreground" />
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      </div>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        <ArrowLeft data-icon="inline-start" />
        Back to invoices
      </Link>
    </main>
  );
}
