"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 p-10">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-center text-sm text-muted-foreground" role="alert">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
