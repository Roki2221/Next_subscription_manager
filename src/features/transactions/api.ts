import { toast } from "sonner";

import { triggerBrowserDownload } from "@/lib/download";

import { MOCK_TRANSACTIONS } from "./mocks";
import type { Transaction } from "./types";

/**
 * Mock API service — simulates network I/O without coupling UI to fetch details.
 *
 * Why a dedicated module?
 * - Components stay declarative; they call hooks that wrap these functions.
 * - Swapping mocks for real REST/GraphQL endpoints is a one-file change.
 * - Latency, error rates, and side-effects (download, toast) live here, not in JSX.
 */

/** Artificial delay helper — mirrors `setTimeout`-based backend latency. */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Random integer in [min, max] inclusive. */
const randomDelay = (minMs: number, maxMs: number): number =>
  minMs + Math.floor(Math.random() * (maxMs - minMs + 1));

/**
 * Fetches the full transaction list.
 * Adds a short delay so loading states are observable during development.
 */
export async function getTransactions(): Promise<Transaction[]> {
  await sleep(600);
  // Return a shallow copy so callers cannot mutate the canonical mock seed.
  return MOCK_TRANSACTIONS.map((transaction) => ({ ...transaction }));
}

/**
 * Simulates invoice PDF generation and triggers a browser download.
 * Shows a success toast once the (mock) network request completes.
 */
export async function downloadInvoice(id: string): Promise<void> {
  await sleep(2000);

  const blob = new Blob(["Invoice PDF"], { type: "application/pdf" });
  triggerBrowserDownload(blob, `invoice-${id}.pdf`);

  toast.success("Invoice downloaded successfully", {
    description: `Invoice for transaction ${id} is ready.`,
  });
}

/**
 * Retries a failed payment.
 *
 * - Random delay between 1–4 seconds to mimic gateway latency.
 * - 20% failure rate to exercise error handling and optimistic rollback paths.
 */
export async function retryTransaction(id: string): Promise<Transaction> {
  await sleep(randomDelay(1000, 4000));

  if (Math.random() < 0.2) {
    throw new Error(`Payment retry failed for transaction ${id}. Please try again.`);
  }

  const existing = MOCK_TRANSACTIONS.find((transaction) => transaction.id === id);

  if (!existing) {
    throw new Error(`Transaction ${id} not found.`);
  }

  return { ...existing, status: "success" };
}
