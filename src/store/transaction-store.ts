import { create } from "zustand";

/**
 * Lightweight client state for the transactions dashboard.
 *
 * React Query owns server/async data (the transaction list). Zustand owns
 * ephemeral UI state that should NOT live in the query cache:
 * - which failed rows are selected for batch retry
 * - which rows are currently mid-retry (independent per-row loaders)
 *
 * Keeping these separate avoids polluting cache keys and makes selection
 * survive refetches without accidental desync.
 */
interface TransactionStore {
  /** IDs of failed transactions checked for batch retry. */
  selectedIds: string[];
  /** IDs currently awaiting a retry API response — one entry per row. */
  retryingIds: string[];

  toggleSelected: (id: string) => void;
  setSelected: (id: string, selected: boolean) => void;
  selectAll: (ids: readonly string[]) => void;
  clearSelection: () => void;
  deselect: (id: string) => void;

  addRetrying: (id: string) => void;
  removeRetrying: (id: string) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  selectedIds: [],
  retryingIds: [],

  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((existingId) => existingId !== id)
        : [...state.selectedIds, id],
    })),

  setSelected: (id, selected) =>
    set((state) => {
      if (selected) {
        return state.selectedIds.includes(id)
          ? state
          : { selectedIds: [...state.selectedIds, id] };
      }

      return {
        selectedIds: state.selectedIds.filter((existingId) => existingId !== id),
      };
    }),

  selectAll: (ids) => set({ selectedIds: [...ids] }),

  clearSelection: () => set({ selectedIds: [] }),

  deselect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((existingId) => existingId !== id),
    })),

  addRetrying: (id) =>
    set((state) =>
      state.retryingIds.includes(id)
        ? state
        : { retryingIds: [...state.retryingIds, id] },
    ),

  removeRetrying: (id) =>
    set((state) => ({
      retryingIds: state.retryingIds.filter((existingId) => existingId !== id),
    })),
}));

/** Subscribe to a single row's retry loading flag — avoids whole-table re-renders. */
export function useIsRetrying(id: string): boolean {
  return useTransactionStore((state) => state.retryingIds.includes(id));
}

/** Subscribe to a single row's selection state. */
export function useIsSelected(id: string): boolean {
  return useTransactionStore((state) => state.selectedIds.includes(id));
}
