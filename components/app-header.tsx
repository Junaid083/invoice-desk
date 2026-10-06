import Link from "next/link";
import { HardHat } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
            <HardHat className="size-4.5" />
          </span>
          <span className="font-semibold tracking-tight">Invoice Desk</span>
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:inline">/ Accounts payable</span>
      </div>
    </header>
  );
}
