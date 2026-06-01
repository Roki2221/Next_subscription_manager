/**
 * Domain types for the transactions feature slice.
 *
 * Colocated with the feature (not a global types/ dump) so the boundary of
 * this module is explicit — importers know these shapes belong to transactions.
 */

export type TransactionStatus = "success" | "failed" | "pending";

export interface Transaction {
  id: string;
  amount: number;
  /** ISO-8601 timestamp from the mock API. */
  createdAt: string;
  status: TransactionStatus;
}

/** Stable React Query cache keys — single source of truth for invalidation. */
export const transactionQueryKeys = {
  all: ["transactions"] as const,
  list: () => [...transactionQueryKeys.all, "list"] as const,
  detail: (id: string) => [...transactionQueryKeys.all, "detail", id] as const,
} as const;
