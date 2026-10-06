"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
        <TriangleAlert className="size-6 text-rose-600" />
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">An unexpected error occurred. Please try again.</p>
      </div>
      <Button variant="outline" onClick={() => retry()}>
        <RotateCw data-icon="inline-start" />
        Try again
      </Button>
    </main>
  );
}
