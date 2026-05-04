import { create } from 'zustand';

export type FilterType = 'all' | 'read' | 'unread' | 'borrowed';
export type ViewMode = 'list' | 'grid';
export type SortOrder = 'recent' | 'title_asc' | 'author_asc' | 'rating_desc';

interface BookStoreState {
  activeFilter: FilterType;
  searchQuery: string;
  viewMode: ViewMode;
  sortOrder: SortOrder;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortOrder: (order: SortOrder) => void;
}

export const useBookStore = create<BookStoreState>((set) => ({
  activeFilter: 'all',
  searchQuery: '',
  viewMode: 'list',
  sortOrder: 'recent',
  setFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortOrder: (order) => set({ sortOrder: order }),
}));
