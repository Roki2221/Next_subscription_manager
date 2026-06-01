# Cleeng Transactions Dashboard

A production-oriented transactions dashboard built with **Next.js (App Router)**, **React 19**, **TypeScript (strict)**, **TanStack React Query v5**, **Zustand**, **Shadcn/UI**, and **Tailwind CSS**.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Features

- **Transaction list** — fetched via React Query with loading and error states
- **Invoice download** — mock PDF generation with per-row loading indicator and success toast
- **Single retry** — retry one failed payment with optimistic `pending` status and independent row loader
- **Batch retry** — select multiple failed rows, retry concurrently via `Promise.allSettled` (one failure does not block others)
- **Accessibility** — `aria-label`, `aria-busy`, and keyboard-accessible Shadcn controls throughout

## Architecture

Feature-sliced layout under `src/`:

```text
src/
├── app/                    # Next.js App Router (RSC shell + providers boundary)
├── components/             # Presentational UI (table, rows, buttons)
├── features/transactions/  # Domain slice: types, mocks, api, hooks
├── store/                  # Zustand client state (selection, per-row loading)
├── lib/                    # Pure utilities (download, retry batch orchestration)
└── types/                  # Shared type re-exports
```

### Separation of concerns

| Layer | Responsibility |
| ----- | -------------- |
| `features/transactions/api.ts` | Mock network I/O (fetch, download, retry) |
| `features/transactions/hooks.ts` | React Query + optimistic cache updates |
| `store/transaction-store.ts` | Ephemeral UI state (selection, per-row retry flags) |
| `lib/retry-payment.ts` | `Promise.allSettled` batch orchestration |
| `components/*` | Rendering only — no direct API calls |

## Tech stack

- Next.js 16 (App Router) · React 19 · TypeScript (strict)
- TanStack React Query v5 · Zustand · Sonner
- Tailwind CSS v4 · Shadcn/UI · date-fns · lucide-react

## Assignment notes

- Mock retry API has a **20% failure rate** and **1–4 s** random latency — use batch retry to observe concurrent independent row states.
- Invoice download simulates a **2 s** network delay before triggering a browser download.
