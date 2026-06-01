"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { triggerBrowserDownload } from "@/lib/download";
import { retryPaymentsBatch } from "@/lib/retry-payment";
import {
  isTransactionRetrying,
  useTransactionStore,
} from "@/store/transaction-store";

import { fetchInvoiceBlob, getTransactions, retryTransaction } from "./api";
import { transactionQueryKeys, type Transaction } from "./types";

function mergeRefetchWithRetryingRows(
  queryClient: QueryClient,
  fresh: Transaction[],
): Transaction[] {
  const retryingIds = useTransactionStore.getState().retryingIds;
  if (retryingIds.size === 0) {
    return fresh;
  }

  const current =
    queryClient.getQueryData<Transaction[]>(transactionQueryKeys.list()) ?? [];

  const currentById = new Map(current.map((transaction) => [transaction.id, transaction]));

  return fresh.map((transaction) =>
    retryingIds.has(transaction.id)
      ? (currentById.get(transaction.id) ?? transaction)
      : transaction,
  );
}

/** Fetches and caches the transaction list. */
export function useTransactions() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: transactionQueryKeys.list(),
    queryFn: async () => {
      const fresh = await getTransactions();
      return mergeRefetchWithRetryingRows(queryClient, fresh);
    },
  });
}

/** Triggers a mock invoice download for a single transaction (concurrent-safe). */
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: fetchInvoiceBlob,
    onMutate: (id) => {
      useTransactionStore.getState().addDownloading(id);
    },
    onSuccess: (blob, id) => {
      triggerBrowserDownload(blob, `invoice-${id}.pdf`);
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
    onSettled: (_data, _error, id) => {
      useTransactionStore.getState().removeDownloading(id);
    },
  });
}

/**
 * Retry orchestration — in-flight state lives in Zustand only; cache holds server truth.
 */
export function useTransactionRetry() {
  const queryClient = useQueryClient();

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

  const beginRetry = useCallback((id: string): boolean => {
    if (isTransactionRetrying(id)) {
      return false;
    }

    useTransactionStore.getState().addRetrying(id);
    return true;
  }, []);

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
    [beginRetry, finalizeRetry, replaceTransaction],
  );

  const retrySelected = useCallback(
    async (ids: readonly string[]) => {
      const eligibleIds = getEligibleRetryIds(ids);

      if (eligibleIds.length === 0) {
        return;
      }

      for (const id of eligibleIds) {
        beginRetry(id);
      }

      const results = await retryPaymentsBatch(eligibleIds, retryTransaction);

      let successCount = 0;
      const failures: string[] = [];

      for (const { id, outcome } of results) {
        if (outcome.status === "fulfilled") {
          replaceTransaction(outcome.value);
          useTransactionStore.getState().deselect(id);
          successCount += 1;
        } else {
          const message =
            outcome.reason instanceof Error
              ? outcome.reason.message
              : "An unexpected error occurred.";
          failures.push(`${id}: ${message}`);
        }

        finalizeRetry(id);
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} payment${successCount === 1 ? "" : "s"} retried successfully`,
        );
      }

      if (failures.length === 1) {
        toast.error("Payment retry failed", { description: failures[0] });
      } else if (failures.length > 1) {
        toast.error(`${failures.length} payments failed to retry`, {
          description: failures.join("\n"),
        });
      }

      useTransactionStore.getState().clearSelection();
    },
    [beginRetry, finalizeRetry, getEligibleRetryIds, replaceTransaction],
  );

  return { retrySingle, retrySelected };
}
