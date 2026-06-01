"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useCallback, useMemo } from "react";

import { TransactionRow } from "@/components/transaction-row";
import { TransactionsTableSkeleton } from "@/components/transactions-table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDownloadInvoice,
  useTransactionRetry,
  useTransactions,
} from "@/features/transactions/hooks";
import {
  useFailedSelectionState,
  useIsBatchRetrying,
  useSelectedCount,
  useTransactionStore,
} from "@/store/transaction-store";

export function TransactionsTable() {
  const { data: transactions = [], isLoading, isError, error, refetch } =
    useTransactions();
  const { retrySingle, retrySelected } = useTransactionRetry();
  const downloadMutation = useDownloadInvoice();

  const selectedCount = useSelectedCount();
  const selectAll = useTransactionStore((state) => state.selectAll);
  const clearSelection = useTransactionStore((state) => state.clearSelection);
  const isBatchRetrying = useIsBatchRetrying();

  const failedIds = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.status === "failed")
        .map((transaction) => transaction.id),
    [transactions],
  );

  const { allFailedSelected, someFailedSelected } =
    useFailedSelectionState(failedIds);

  const handleSelectAllFailed = useCallback(
    (checked: boolean) => {
      if (checked) {
        selectAll(failedIds);
        return;
      }

      clearSelection();
    },
    [clearSelection, failedIds, selectAll],
  );

  const handleRetrySelected = useCallback(() => {
    void retrySelected([
      ...useTransactionStore.getState().selectedIds,
    ]);
  }, [retrySelected]);

  const handleDownload = useCallback(
    (id: string) => {
      if (useTransactionStore.getState().downloadingIds.has(id)) {
        return;
      }

      downloadMutation.mutate(id);
    },
    [downloadMutation],
  );

  const handleRetry = useCallback(
    (id: string) => {
      void retrySingle(id);
    },
    [retrySingle],
  );

  if (isLoading) {
    return <TransactionsTableSkeleton />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error
              ? error.message
              : "Failed to load transactions."}
          </p>
          <Button
            type="button"
            variant="outline"
            aria-label="Retry loading transactions"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Recent transactions</CardTitle>

        <Button
          type="button"
          variant="default"
          disabled={selectedCount === 0 || isBatchRetrying}
          aria-label={`Retry ${selectedCount} selected transaction${selectedCount === 1 ? "" : "s"}`}
          aria-busy={isBatchRetrying}
          onClick={handleRetrySelected}
        >
          {isBatchRetrying ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw aria-hidden="true" />
          )}
          Retry Selected
          {selectedCount > 0 ? (
            <span className="ml-1 text-primary-foreground/80">
              ({selectedCount})
            </span>
          ) : null}
        </Button>
      </CardHeader>

      <CardContent>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {isBatchRetrying
            ? "Retrying selected transactions"
            : `${transactions.length} transactions loaded`}
        </p>

        <Table aria-label="Transactions list">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allFailedSelected
                      ? true
                      : someFailedSelected
                        ? "indeterminate"
                        : false
                  }
                  disabled={failedIds.length === 0 || isBatchRetrying}
                  onCheckedChange={(checked) =>
                    handleSelectAllFailed(checked === true)
                  }
                  aria-label="Select all failed transactions for batch retry"
                />
              </TableHead>
              <TableHead scope="col">Transaction ID</TableHead>
              <TableHead scope="col">Amount</TableHead>
              <TableHead scope="col">Date</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" className="w-28">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onDownload={handleDownload}
                  onRetry={handleRetry}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
