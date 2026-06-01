import { create } from "zustand";

/**
 * Ephemeral UI state for the transactions dashboard.
 *
 * React Query owns server data (the transaction list). Zustand owns selection,
 * per-row retry loaders, and per-row download loaders — never duplicated in cache.
 */
interface TransactionStore {
  selectedIds: Set<string>;
  retryingIds: Set<string>;
  downloadingIds: Set<string>;

  toggleSelected: (id: string) => void;
  setSelected: (id: string, selected: boolean) => void;
  selectAll: (ids: readonly string[]) => void;
  clearSelection: () => void;
  deselect: (id: string) => void;

  addRetrying: (id: string) => void;
  removeRetrying: (id: string) => void;

  addDownloading: (id: string) => void;
  removeDownloading: (id: string) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  selectedIds: new Set(),
  retryingIds: new Set(),
  downloadingIds: new Set(),

  toggleSelected: (id) =>
    set((state) => {
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(id)) {
        selectedIds.delete(id);
      } else {
        selectedIds.add(id);
      }
      return { selectedIds };
    }),

  setSelected: (id, selected) =>
    set((state) => {
      const selectedIds = new Set(state.selectedIds);
      if (selected) {
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }
      return { selectedIds };
    }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  clearSelection: () => set({ selectedIds: new Set() }),

  deselect: (id) =>
    set((state) => {
      const selectedIds = new Set(state.selectedIds);
      selectedIds.delete(id);
      return { selectedIds };
    }),

  addRetrying: (id) =>
    set((state) => {
      if (state.retryingIds.has(id)) {
        return state;
      }
      const retryingIds = new Set(state.retryingIds);
      retryingIds.add(id);
      return { retryingIds };
    }),

  removeRetrying: (id) =>
    set((state) => {
      const retryingIds = new Set(state.retryingIds);
      retryingIds.delete(id);
      return { retryingIds };
    }),

  addDownloading: (id) =>
    set((state) => {
      if (state.downloadingIds.has(id)) {
        return state;
      }
      const downloadingIds = new Set(state.downloadingIds);
      downloadingIds.add(id);
      return { downloadingIds };
    }),

  removeDownloading: (id) =>
    set((state) => {
      const downloadingIds = new Set(state.downloadingIds);
      downloadingIds.delete(id);
      return { downloadingIds };
    }),
}));

/** Imperative read — guards against duplicate in-flight retries. */
export function isTransactionRetrying(id: string): boolean {
  return useTransactionStore.getState().retryingIds.has(id);
}

/** True when any selected row is currently being retried (batch toolbar state). */
export function useIsBatchRetrying(): boolean {
  return useTransactionStore((state) => {
    if (state.selectedIds.size === 0) {
      return false;
    }
    for (const id of state.selectedIds) {
      if (state.retryingIds.has(id)) {
        return true;
      }
    }
    return false;
  });
}

export function useIsRetrying(id: string): boolean {
  return useTransactionStore((state) => state.retryingIds.has(id));
}

export function useIsSelected(id: string): boolean {
  return useTransactionStore((state) => state.selectedIds.has(id));
}

export function useIsDownloading(id: string): boolean {
  return useTransactionStore((state) => state.downloadingIds.has(id));
}

export function useSelectedCount(): number {
  return useTransactionStore((state) => state.selectedIds.size);
}

/** Primitives only — avoids new-object selectors that trigger infinite re-renders. */
export function useFailedSelectionState(failedIds: readonly string[]) {
  const allFailedSelected = useTransactionStore((state) => {
    if (failedIds.length === 0) {
      return false;
    }

    for (const id of failedIds) {
      if (!state.selectedIds.has(id)) {
        return false;
      }
    }

    return true;
  });

  const someFailedSelected = useTransactionStore((state) => {
    if (failedIds.length === 0) {
      return false;
    }

    let selectedFailedCount = 0;
    for (const id of failedIds) {
      if (state.selectedIds.has(id)) {
        selectedFailedCount += 1;
      }
    }

    return (
      selectedFailedCount > 0 && selectedFailedCount < failedIds.length
    );
  });

  return { allFailedSelected, someFailedSelected };
}
