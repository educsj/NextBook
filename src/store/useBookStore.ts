import { create } from 'zustand';

type FilterType = 'all' | 'read' | 'unread';

interface BookStoreState {
  activeFilter: FilterType;
  searchQuery: string;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
}

export const useBookStore = create<BookStoreState>((set) => ({
  activeFilter: 'all',
  searchQuery: '',
  setFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
