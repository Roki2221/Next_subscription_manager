"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

/**
 * Client-side providers wrapper.
 *
 * React Query and Sonner require a browser context, so they cannot live in
 * the root Server Component layout directly — this thin client boundary keeps
 * layout.tsx as an RSC while still wiring global async + notification infra.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Treat fetched lists as fresh for 30s to avoid redundant refetches
            // while the user selects rows or triggers single-row retries.
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}
