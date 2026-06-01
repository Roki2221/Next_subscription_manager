import { triggerBrowserDownload } from "@/lib/download";

import { MOCK_TRANSACTIONS } from "./mocks";
import type { Transaction } from "./types";

/**
 * Mock API service — simulates network I/O without UI side-effects.
 * Toasts and other presentation concerns belong in hooks/mutations, not here.
 */

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const randomDelay = (minMs: number, maxMs: number): number =>
  minMs + Math.floor(Math.random() * (maxMs - minMs + 1));

export async function getTransactions(): Promise<Transaction[]> {
  await sleep(600);
  return MOCK_TRANSACTIONS.map((transaction) => ({ ...transaction }));
}

/** Simulates invoice PDF generation; caller handles success/error toasts. */
export async function downloadInvoice(id: string): Promise<void> {
  await sleep(2000);

  const blob = new Blob(["Invoice PDF"], { type: "application/pdf" });
  triggerBrowserDownload(blob, `invoice-${id}.pdf`);
}

export async function retryTransaction(id: string): Promise<Transaction> {
  await sleep(randomDelay(1000, 4000));

  if (Math.random() < 0.2) {
    throw new Error(
      `Payment retry failed for transaction ${id}. Please try again.`,
    );
  }

  const existing = MOCK_TRANSACTIONS.find((transaction) => transaction.id === id);

  if (!existing) {
    throw new Error(`Transaction ${id} not found.`);
  }

  return { ...existing, status: "success" };
}
