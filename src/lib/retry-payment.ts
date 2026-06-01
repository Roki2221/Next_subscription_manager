import type { Transaction } from "@/features/transactions/types";

export interface BatchRetryItem {
  id: string;
  outcome: PromiseSettledResult<Transaction>;
}

/**
 * Orchestrates concurrent payment retries without fail-fast behaviour.
 *
 * Promise.all would abort visually on the first rejection; allSettled lets
 * each row resolve independently — matching real payment-gateway batch flows
 * where one card decline must not block retries for other customers.
 */
export async function retryPaymentsBatch(
  ids: readonly string[],
  retryFn: (id: string) => Promise<Transaction>,
): Promise<BatchRetryItem[]> {
  const outcomes = await Promise.allSettled(ids.map((id) => retryFn(id)));

  return ids.map((id, index) => ({
    id,
    outcome: outcomes[index]!,
  }));
}
