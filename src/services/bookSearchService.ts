import type { BookData, GoogleBooksResponse, GoogleBooksVolume } from '../types/book';

const TIMEOUT_MS = 8000;

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly type: 'offline' | 'timeout' | 'not_found' | 'api_error' | 'rate_limit',
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── HTTP Utility ─────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('timeout', 'Tempo limite da requisição excedido.');
    }
    throw new ApiError('offline', 'Sem conexão com a internet.');
  }
}

// ─── Google Books ─────────────────────────────────────────────────────────────

function volumeToBookData(volume: GoogleBooksVolume): BookData {
  const { volumeInfo } = volume;
  const isbn = volumeInfo.industryIdentifiers?.find(
    (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10',
  )?.identifier;
  const coverUrl = volumeInfo.imageLinks?.thumbnail
    ?.replace('http://', 'https://')
    .replace('&edge=curl', '')
    .replace('zoom=1', 'zoom=2');
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

async function fetchGoogleVolumes(query: string, extraParams = ''): Promise<GoogleBooksVolume[]> {
  const safeQuery = encodeURIComponent(query).replace(/%3A/g, ':');
  const url = `https://www.googleapis.com/books/v1/volumes?q=${safeQuery}&maxResults=10&printType=books${extraParams}`;
  const response = await fetchWithTimeout(url);
  if (response.status === 429) {
    throw new ApiError('rate_limit', 'Muitas buscas em pouco tempo. Aguarde um momento e tente novamente.');
  }
  if (!response.ok) throw new ApiError('api_error', `Google Books: erro ${response.status}`);
  const data: GoogleBooksResponse = await response.json();
  return data.items ?? [];
}

async function searchGoogleByISBN(isbn: string): Promise<BookData | null> {
  const volumes = await fetchGoogleVolumes(`isbn:${isbn}`);
  if (volumes.length === 0) return null;
  return volumeToBookData(volumes[0]);
}

async function searchGoogleByTitle(query: string): Promise<BookData[]> {
  const volumes = await fetchGoogleVolumes(query);
  return volumes.map(volumeToBookData);
}

async function searchGoogleByTitlePT(query: string): Promise<BookData[]> {
  const volumes = await fetchGoogleVolumes(query, '&langRestrict=pt');
  return volumes.map(volumeToBookData);
}

// ─── BrasilAPI (base CBL — livros nacionais) ──────────────────────────────────

interface BrasilApiBook {
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  page_count?: number;
  cover_url?: string;
}

async function searchBrasilAPI(isbn: string): Promise<BookData | null> {
  const response = await fetchWithTimeout(`https://brasilapi.com.br/api/isbn/v1/${isbn}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError('api_error', `BrasilAPI: erro ${response.status}`);

  const data: BrasilApiBook = await response.json();
  return {
    title: data.title,
    author: data.authors?.join(', ') || 'Autor desconhecido',
    isbn: data.isbn,
    coverUrl: data.cover_url || undefined,
    totalPages: data.page_count || undefined,
    readPages: 0,
    isRead: false,
    isSynced: false,
  };
}

// ─── OpenLibrary (Internet Archive) ──────────────────────────────────────────

interface OpenLibraryBook {
  title?: string;
  authors?: Array<{ name: string }>;
  number_of_pages?: number;
  cover?: { small?: string; medium?: string; large?: string };
  identifiers?: { isbn_13?: string[]; isbn_10?: string[] };
}

async function searchOpenLibraryByISBN(isbn: string): Promise<BookData | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new ApiError('api_error', `OpenLibrary: erro ${response.status}`);

  const data: Record<string, OpenLibraryBook> = await response.json();
  const book = data[`ISBN:${isbn}`];
  if (!book) return null;

  const coverUrl = book.cover?.large ?? book.cover?.medium ?? book.cover?.small;
  const extractedIsbn = book.identifiers?.isbn_13?.[0] ?? book.identifiers?.isbn_10?.[0] ?? isbn;

  return {
    title: book.title ?? 'Título desconhecido',
    author: book.authors?.map((a) => a.name).join(', ') ?? 'Autor desconhecido',
    isbn: extractedIsbn,
    coverUrl,
    totalPages: book.number_of_pages,
    readPages: 0,
    isRead: false,
    isSynced: false,
  };
}

async function searchOpenLibraryByTitle(query: string): Promise<BookData[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&language=por`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new ApiError('api_error', `OpenLibrary: erro ${response.status}`);

  const data = await response.json();
  const docs: any[] = data.docs ?? [];

  return docs.map((doc) => ({
    title: doc.title || 'Título desconhecido',
    author: doc.author_name?.join(', ') || 'Autor desconhecido',
    isbn: doc.isbn?.[0],
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined,
    totalPages: doc.number_of_pages_median,
    readPages: 0,
    isRead: false,
    isSynced: false,
  }));
}

// ─── Apple Books / iTunes ─────────────────────────────────────────────────────

function itunesItemToBookData(item: any, fallbackIsbn?: string): BookData {
  return {
    title: item.trackName || item.trackCensoredName || 'Título desconhecido',
    author: item.artistName || 'Autor desconhecido',
    isbn: fallbackIsbn,
    coverUrl: item.artworkUrl100
      ? item.artworkUrl100.replace('100x100bb', '600x600bb')
      : undefined,
    totalPages: undefined,
    readPages: 0,
    isRead: false,
    isSynced: false,
  };
}

async function searchAppleBooksByISBN(isbn: string): Promise<BookData | null> {
  const url = `https://itunes.apple.com/lookup?isbn=${isbn}&country=BR&media=ebook`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new ApiError('api_error', `Apple Books: erro ${response.status}`);

  const data = await response.json();
  if (!data.results || data.results.length === 0) return null;
  return itunesItemToBookData(data.results[0], isbn);
}

async function searchAppleBooksByTitle(query: string): Promise<BookData[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=ebook&country=BR&limit=10`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new ApiError('api_error', `Apple Books: erro ${response.status}`);

  const data = await response.json();
  return (data.results ?? []).map((item: any) => itunesItemToBookData(item));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function propagateIfOffline(e: unknown): void {
  if (e instanceof ApiError && e.type === 'offline') throw e;
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Busca por ISBN:
 * Google Books → BrasilAPI → OpenLibrary → Apple Books (iTunes)
 */
export async function searchBookByISBN(isbn: string): Promise<BookData | null> {
  // 1ª: Google Books (maior cobertura global)
  try {
    const result = await searchGoogleByISBN(isbn);
    if (result) return result;
  } catch (e) {
    propagateIfOffline(e);
  }

  // 2ª: BrasilAPI — CBL, excelente para livros nacionais
  try {
    const result = await searchBrasilAPI(isbn);
    if (result) return result;
  } catch (e) {
    propagateIfOffline(e);
  }

  // 3ª: OpenLibrary — catálogo aberto do Internet Archive
  try {
    const result = await searchOpenLibraryByISBN(isbn);
    if (result) return result;
  } catch (e) {
    propagateIfOffline(e);
  }

  // 4ª: Apple Books — bom catálogo em PT-BR
  try {
    return await searchAppleBooksByISBN(isbn);
  } catch (e) {
    propagateIfOffline(e);
    return null;
  }
}

/**
 * Busca por título:
 * Google Books (geral) → Google Books PT → OpenLibrary → Apple Books
 */
export async function searchBooksByTitle(query: string): Promise<BookData[]> {
  // 1ª: Google Books geral
  try {
    const results = await searchGoogleByTitle(query);
    if (results.length > 0) return results;
  } catch (e) {
    propagateIfOffline(e);
  }

  // 2ª: Google Books restrito a PT — captura edições BR que escapam da busca geral
  try {
    const results = await searchGoogleByTitlePT(query);
    if (results.length > 0) return results;
  } catch (e) {
    propagateIfOffline(e);
  }

  // 3ª: OpenLibrary — boa cobertura de títulos em português
  try {
    const results = await searchOpenLibraryByTitle(query);
    if (results.length > 0) return results;
  } catch (e) {
    propagateIfOffline(e);
  }

  // 4ª: Apple Books — popular no mercado brasileiro
  try {
    return await searchAppleBooksByTitle(query);
  } catch (e) {
    propagateIfOffline(e);
    return [];
  }
}
