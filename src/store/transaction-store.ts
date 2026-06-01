import { create } from "zustand";

/**
 * Lightweight client state for the transactions dashboard.
 *
 * React Query owns server/async data (the transaction list). Zustand owns
 * ephemeral UI state that should NOT live in the query cache:
 * - which failed rows are selected for batch retry
 * - which rows are currently mid-retry (independent per-row loaders)
 */
interface TransactionStore {
  selectedIds: string[];
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

/** Imperative read — used to guard against duplicate in-flight retries. */
export function isTransactionRetrying(id: string): boolean {
  return useTransactionStore.getState().retryingIds.includes(id);
}

/** True when any selected row is currently being retried (batch toolbar state). */
export function useIsBatchRetrying(): boolean {
  return useTransactionStore(
    (state) =>
      state.selectedIds.length > 0 &&
      state.selectedIds.some((id) => state.retryingIds.includes(id)),
  );
}

/** Subscribe to a single row's retry loading flag. */
export function useIsRetrying(id: string): boolean {
  return useTransactionStore((state) => state.retryingIds.includes(id));
}

/** Subscribe to a single row's selection state. */
export function useIsSelected(id: string): boolean {
  return useTransactionStore((state) => state.selectedIds.includes(id));
}
