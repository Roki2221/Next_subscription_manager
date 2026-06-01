import type { Transaction } from "./types";

/**
 * Static seed data for the mock API.
 *
 * In a real app this file would not exist — data comes from the backend.
 * We keep a dedicated mocks module so api.ts reads like production code
 * (fetch → parse → return) and components never import raw fixtures.
 */
export const MOCK_TRANSACTIONS: readonly Transaction[] = [
  {
    id: "txn_01HQ8XK2M9",
    amount: 49.99,
    createdAt: "2026-05-28T09:14:22.000Z",
    status: "success",
  },
  {
    id: "txn_01HQ8XK2N1",
    amount: 129.0,
    createdAt: "2026-05-28T11:02:05.000Z",
    status: "failed",
  },
  {
    id: "txn_01HQ8XK2P4",
    amount: 19.99,
    createdAt: "2026-05-29T08:45:11.000Z",
    status: "failed",
  },
  {
    id: "txn_01HQ8XK2Q7",
    amount: 299.5,
    createdAt: "2026-05-29T14:20:33.000Z",
    status: "success",
  },
  {
    id: "txn_01HQ8XK2R0",
    amount: 9.99,
    createdAt: "2026-05-30T06:00:00.000Z",
    status: "pending",
  },
  {
    id: "txn_01HQ8XK2S3",
    amount: 74.25,
    createdAt: "2026-05-30T16:55:48.000Z",
    status: "failed",
  },
  {
    id: "txn_01HQ8XK2T6",
    amount: 199.0,
    createdAt: "2026-05-31T07:12:19.000Z",
    status: "success",
  },
  {
    id: "txn_01HQ8XK2U9",
    amount: 34.5,
    createdAt: "2026-05-31T10:30:00.000Z",
    status: "failed",
  },
] as const;
