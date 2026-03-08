import { create } from 'zustand';

interface SearchStore {
  showSearchModal: boolean;
  initialSearchQuery: string;
  pendingSearchQuery: string | null;
  openSearch: (initialQuery?: string) => void;
  closeSearch: () => void;
  submitSearchAndGoToShop: (query: string) => string | null;
  consumePendingQuery: () => string | null;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  showSearchModal: false,
  initialSearchQuery: '',
  pendingSearchQuery: null,

  openSearch: (initialQuery = '') => set({ showSearchModal: true, initialSearchQuery: initialQuery }),

  closeSearch: () => set({ showSearchModal: false, initialSearchQuery: '' }),

  submitSearchAndGoToShop: (query: string) => {
    const trimmed = query.trim();
    set({
      showSearchModal: false,
      pendingSearchQuery: trimmed || null,
    });
    return trimmed || null;
  },

  consumePendingQuery: () => {
    const q = get().pendingSearchQuery;
    set({ pendingSearchQuery: null });
    return q;
  },
}));
