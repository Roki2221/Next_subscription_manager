"use client";

import { format, isValid, parseISO } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { memo, useMemo } from "react";

import { RetryButton } from "@/components/retry-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Transaction } from "@/features/transactions/types";
import { cn } from "@/lib/utils";
import {
  useIsRetrying,
  useIsSelected,
  useTransactionStore,
} from "@/store/transaction-store";

interface TransactionRowProps {
  transaction: Transaction;
  onDownload: (id: string) => void;
  onRetry: (id: string) => void;
  isDownloading: boolean;
}

const statusLabel: Record<Transaction["status"], string> = {
  success: "Successful",
  failed: "Failed",
  pending: "Pending",
};

const statusVariant: Record<
  Transaction["status"],
  "default" | "destructive" | "secondary"
> = {
  success: "default",
  failed: "destructive",
  pending: "secondary",
};

const amountFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatTransactionDate(isoDate: string): string {
  const parsed = parseISO(isoDate);
  if (!isValid(parsed)) {
    return "Invalid date";
  }

  return format(parsed, "MMM d, yyyy · HH:mm");
}

function TransactionRowComponent({
  transaction,
  onDownload,
  onRetry,
  isDownloading,
}: TransactionRowProps) {
  const { id, amount, createdAt, status } = transaction;
  const isFailed = status === "failed";
  const isPending = status === "pending";

  const isSelected = useIsSelected(id);
  const isRetrying = useIsRetrying(id);
  const toggleSelected = useTransactionStore((state) => state.toggleSelected);

  const formattedDate = useMemo(
    () => formatTransactionDate(createdAt),
    [createdAt],
  );
  const formattedAmount = useMemo(
    () => amountFormatter.format(amount),
    [amount],
  );

  const isActionDisabled = isRetrying || isPending;

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      aria-busy={isRetrying || isPending}
    >
      <TableCell>
        {isFailed ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleSelected(id)}
            aria-label={`Select transaction ${id} for batch retry`}
            disabled={isActionDisabled}
          />
        ) : (
          <span className="sr-only">Not selectable</span>
        )}
      </TableCell>

      <TableCell className="font-mono text-xs">{id}</TableCell>

      <TableCell className="font-medium">{formattedAmount}</TableCell>

      <TableCell className="text-muted-foreground">{formattedDate}</TableCell>

      <TableCell>
        <Badge
          variant={statusVariant[status]}
          className={cn(isPending && "gap-1")}
        >
          {isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : null}
          <span aria-live="polite">{statusLabel[status]}</span>
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isDownloading || isActionDisabled}
            aria-label={
              isDownloading
                ? `Downloading invoice for transaction ${id}`
                : `Download invoice for transaction ${id}`
            }
            aria-busy={isDownloading}
            onClick={() => onDownload(id)}
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
          </Button>

          {isFailed ? (
            <RetryButton
              transactionId={id}
              isLoading={isRetrying}
              onRetry={onRetry}
            />
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export const TransactionRow = memo(TransactionRowComponent);
