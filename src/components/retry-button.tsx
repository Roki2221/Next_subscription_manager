"use client";

import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RetryButtonProps {
  transactionId: string;
  isLoading: boolean;
  disabled?: boolean;
  onRetry: (id: string) => void;
  /** Compact icon-only variant for table rows. */
  size?: "default" | "sm";
}

/**
 * Accessible retry trigger with an independent loading indicator.
 * Each row passes its own `isLoading` so one slow retry never blocks others.
 */
export function RetryButton({
  transactionId,
  isLoading,
  disabled = false,
  onRetry,
  size = "sm",
}: RetryButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={disabled || isLoading}
      aria-label={
        isLoading
          ? `Retrying payment for transaction ${transactionId}`
          : `Retry payment for transaction ${transactionId}`
      }
      aria-busy={isLoading}
      onClick={() => onRetry(transactionId)}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <RotateCcw aria-hidden="true" />
      )}
      {size === "default" ? (isLoading ? "Retrying…" : "Retry") : null}
    </Button>
  );
}
