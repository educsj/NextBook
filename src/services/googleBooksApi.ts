import type { BookData, GoogleBooksResponse, GoogleBooksVolume } from '../types/book';

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

async function fetchVolumes(query: string): Promise<GoogleBooksVolume[]> {
  const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=5`);

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data: GoogleBooksResponse = await response.json();
  return data.items ?? [];
}

export async function searchBookByISBN(isbn: string): Promise<BookData | null> {
  const volumes = await fetchVolumes(`isbn:${isbn}`);

  if (volumes.length === 0) return null;

  return volumeToBookData(volumes[0]);
}

export async function searchBooksByTitle(title: string): Promise<BookData[]> {
  const volumes = await fetchVolumes(`intitle:${title}`);
  return volumes.map(volumeToBookData);
}

function volumeToBookData(volume: GoogleBooksVolume): BookData {
  const { volumeInfo } = volume;
  const isbn = volumeInfo.industryIdentifiers?.find(
    (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
  )?.identifier;

  const coverUrl = volumeInfo.imageLinks?.thumbnail
    ?.replace('http://', 'https://')
    .replace('&edge=curl', '');

  return {
    title: volumeInfo.title,
    author: volumeInfo.authors?.join(', ') ?? 'Autor desconhecido',
    isbn,
    coverUrl,
    totalPages: volumeInfo.pageCount,
    readPages: 0,
    isRead: false,
    isSynced: false,
  };
}
