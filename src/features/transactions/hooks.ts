"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { retryPaymentsBatch } from "@/lib/retry-payment";
import { useTransactionStore } from "@/store/transaction-store";

import {
  downloadInvoice,
  getTransactions,
  retryTransaction,
} from "./api";
import { transactionQueryKeys, type Transaction } from "./types";

/** Reads the cached transaction list from React Query. */
function useTransactionsQueryClient() {
  const queryClient = useQueryClient();

  const setTransactionStatus = (id: string, status: Transaction["status"]) => {
    queryClient.setQueryData<Transaction[]>(
      transactionQueryKeys.list(),
      (current) =>
        current?.map((transaction) =>
          transaction.id === id ? { ...transaction, status } : transaction,
        ),
    );
  };

  const replaceTransaction = (updated: Transaction) => {
    queryClient.setQueryData<Transaction[]>(
      transactionQueryKeys.list(),
      (current) =>
        current?.map((transaction) =>
          transaction.id === updated.id ? updated : transaction,
        ),
    );
  };

  return { queryClient, setTransactionStatus, replaceTransaction };
}

/** Fetches and caches the transaction list. */
export function useTransactions() {
  return useQuery({
    queryKey: transactionQueryKeys.list(),
    queryFn: getTransactions,
  });
}

/** Triggers a mock invoice download for a single transaction. */
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: downloadInvoice,
    onError: (error: Error) => {
      toast.error("Invoice download failed", {
        description: error.message,
      });
    },
  });
}

/**
 * Encapsulates retry logic: optimistic pending state, per-row loading flags,
 * cache updates, and toast feedback for single + batch flows.
 */
export function useTransactionRetry() {
  const { setTransactionStatus, replaceTransaction } =
    useTransactionsQueryClient();
  const addRetrying = useTransactionStore((state) => state.addRetrying);
  const removeRetrying = useTransactionStore((state) => state.removeRetrying);
  const deselect = useTransactionStore((state) => state.deselect);
  const clearSelection = useTransactionStore((state) => state.clearSelection);

  const beginRetry = (id: string) => {
    addRetrying(id);
    // Optimistic UI: flip to "pending" before the network round-trip completes.
    setTransactionStatus(id, "pending");
  };

  const finalizeRetry = (id: string) => {
    removeRetrying(id);
  };

  const retrySingle = async (id: string) => {
    beginRetry(id);

    try {
      const updated = await retryTransaction(id);
      replaceTransaction(updated);
      deselect(id);
      toast.success("Payment retried successfully", {
        description: `Transaction ${id} is now successful.`,
      });
    } catch (error) {
      setTransactionStatus(id, "failed");
      toast.error("Payment retry failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      finalizeRetry(id);
    }
  };

  const retrySelected = async (ids: readonly string[]) => {
    if (ids.length === 0) {
      return;
    }

    ids.forEach(beginRetry);

    const results = await retryPaymentsBatch(ids, retryTransaction);

    let successCount = 0;

    for (const { id, outcome } of results) {
      if (outcome.status === "fulfilled") {
        replaceTransaction(outcome.value);
        deselect(id);
        successCount += 1;
      } else {
        setTransactionStatus(id, "failed");
        const message =
          outcome.reason instanceof Error
            ? outcome.reason.message
            : "An unexpected error occurred.";

        toast.error(`Retry failed for ${id}`, { description: message });
      }

      finalizeRetry(id);
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} payment${successCount === 1 ? "" : "s"} retried successfully`,
      );
    }

    clearSelection();
  };

  return { retrySingle, retrySelected };
}
