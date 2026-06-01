"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useMemo } from "react";

import { TransactionRow } from "@/components/transaction-row";
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
import type { Transaction } from "@/features/transactions/types";
import { useTransactionStore } from "@/store/transaction-store";

/**
 * Client orchestrator for the transactions dashboard.
 * Composes React Query (data), Zustand (selection), and presentational rows.
 */
export function TransactionsTable() {
  const { data: transactions = [], isLoading, isError, error, refetch } =
    useTransactions();
  const { retrySingle, retrySelected } = useTransactionRetry();
  const downloadMutation = useDownloadInvoice();

  const selectedIds = useTransactionStore((state) => state.selectedIds);
  const selectAll = useTransactionStore((state) => state.selectAll);
  const clearSelection = useTransactionStore((state) => state.clearSelection);
  const retryingIds = useTransactionStore((state) => state.retryingIds);

  const failedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === "failed"),
    [transactions],
  );

  const failedIds = useMemo(
    () => failedTransactions.map((transaction) => transaction.id),
    [failedTransactions],
  );

  const allFailedSelected =
    failedIds.length > 0 &&
    failedIds.every((id) => selectedIds.includes(id));

  const someFailedSelected =
    failedIds.some((id) => selectedIds.includes(id)) && !allFailedSelected;

  const isBatchRetrying = selectedIds.some((id) => retryingIds.includes(id));

  const handleSelectAllFailed = (checked: boolean) => {
    if (checked) {
      selectAll(failedIds);
      return;
    }

    clearSelection();
  };

  const handleRetrySelected = () => {
    void retrySelected(selectedIds);
  };

  const handleDownload = (id: string) => {
    downloadMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span role="status">Loading transactions…</span>
        </CardContent>
      </Card>
    );
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
          disabled={selectedIds.length === 0 || isBatchRetrying}
          aria-label={`Retry ${selectedIds.length} selected transaction${selectedIds.length === 1 ? "" : "s"}`}
          aria-busy={isBatchRetrying}
          onClick={handleRetrySelected}
        >
          {isBatchRetrying ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw aria-hidden="true" />
          )}
          Retry Selected
          {selectedIds.length > 0 ? (
            <span className="ml-1 text-primary-foreground/80">
              ({selectedIds.length})
            </span>
          ) : null}
        </Button>
      </CardHeader>

      <CardContent>
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
                  disabled={failedIds.length === 0}
                  onCheckedChange={(checked) =>
                    handleSelectAllFailed(checked === true)
                  }
                  aria-label="Select all failed transactions for batch retry"
                />
              </TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
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
              transactions.map((transaction: Transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onDownload={handleDownload}
                  onRetry={(id) => void retrySingle(id)}
                  isDownloading={
                    downloadMutation.isPending &&
                    downloadMutation.variables === transaction.id
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
