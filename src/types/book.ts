export interface BookData {
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  totalPages?: number;
  readPages: number;
  isRead: boolean;
  isSynced: boolean;
  rating?: number;
  notes?: string;
}

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    description?: string;
  };
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}
