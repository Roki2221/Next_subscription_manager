"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { retryPaymentsBatch } from "@/lib/retry-payment";
import {
  isTransactionRetrying,
  useTransactionStore,
} from "@/store/transaction-store";

import {
  downloadInvoice,
  getTransactions,
  retryTransaction,
} from "./api";
import { transactionQueryKeys, type Transaction } from "./types";

function updateTransactionInCache(
  queryClient: QueryClient,
  id: string,
  updater: (transaction: Transaction) => Transaction,
) {
  queryClient.setQueryData<Transaction[]>(
    transactionQueryKeys.list(),
    (current) =>
      current?.map((transaction) =>
        transaction.id === id ? updater(transaction) : transaction,
      ),
  );
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
    onSuccess: (_data, id) => {
      toast.success("Invoice downloaded successfully", {
        description: `Invoice for transaction ${id} is ready.`,
      });
    },
    onError: (error: unknown) => {
      toast.error("Invoice download failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    },
  });
}

/**
 * Retry orchestration with optimistic updates and duplicate-request guards.
 */
export function useTransactionRetry() {
  const queryClient = useQueryClient();

  const setTransactionStatus = useCallback(
    (id: string, status: Transaction["status"]) => {
      updateTransactionInCache(queryClient, id, (transaction) => ({
        ...transaction,
        status,
      }));
    },
    [queryClient],
  );

  const replaceTransaction = useCallback(
    (updated: Transaction) => {
      queryClient.setQueryData<Transaction[]>(
        transactionQueryKeys.list(),
        (current) =>
          current?.map((transaction) =>
            transaction.id === updated.id ? updated : transaction,
          ),
      );
    },
    [queryClient],
  );

  /**
   * Returns IDs that are failed in cache and not already retrying.
   * Prevents double-submit when batch + single retry overlap or on rapid clicks.
   */
  const getEligibleRetryIds = useCallback(
    (ids: readonly string[]): string[] => {
      const transactions =
        queryClient.getQueryData<Transaction[]>(transactionQueryKeys.list()) ??
        [];

      const failedIds = new Set(
        transactions
          .filter((transaction) => transaction.status === "failed")
          .map((transaction) => transaction.id),
      );

      return ids.filter(
        (id) => failedIds.has(id) && !isTransactionRetrying(id),
      );
    },
    [queryClient],
  );

  const beginRetry = useCallback(
    (id: string): boolean => {
      if (isTransactionRetrying(id)) {
        return false;
      }

      useTransactionStore.getState().addRetrying(id);
      setTransactionStatus(id, "pending");
      return true;
    },
    [setTransactionStatus],
  );

  const finalizeRetry = useCallback((id: string) => {
    useTransactionStore.getState().removeRetrying(id);
  }, []);

  const retrySingle = useCallback(
    async (id: string) => {
      if (!beginRetry(id)) {
        return;
      }

      try {
        const updated = await retryTransaction(id);
        replaceTransaction(updated);
        useTransactionStore.getState().deselect(id);
        toast.success("Payment retried successfully", {
          description: `Transaction ${id} is now successful.`,
        });
      } catch (error) {
        setTransactionStatus(id, "failed");
        toast.error("Payment retry failed", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
      } finally {
        finalizeRetry(id);
      }
    },
    [beginRetry, finalizeRetry, replaceTransaction, setTransactionStatus],
  );

  const retrySelected = useCallback(
    async (ids: readonly string[]) => {
      const eligibleIds = getEligibleRetryIds(ids);

      if (eligibleIds.length === 0) {
        return;
      }

      eligibleIds.forEach((id) => {
        beginRetry(id);
      });

      const results = await retryPaymentsBatch(eligibleIds, retryTransaction);

      let successCount = 0;

      for (const { id, outcome } of results) {
        if (outcome.status === "fulfilled") {
          replaceTransaction(outcome.value);
          useTransactionStore.getState().deselect(id);
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

      useTransactionStore.getState().clearSelection();
    },
    [
      beginRetry,
      finalizeRetry,
      getEligibleRetryIds,
      replaceTransaction,
      setTransactionStatus,
    ],
  );

  return { retrySingle, retrySelected };
}
