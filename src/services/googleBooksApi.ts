import type { BookData, GoogleBooksResponse, GoogleBooksVolume } from '../types/book';

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(
    public readonly type: 'offline' | 'timeout' | 'not_found' | 'api_error',
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

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
      throw new ApiError('timeout', 'A requisição excedeu o tempo limite.');
    }
    // TypeError = sem rede
    throw new ApiError('offline', 'Sem conexão com a internet.');
  }
}

async function fetchVolumes(query: string, langRestrict?: string): Promise<GoogleBooksVolume[]> {
  const lang = langRestrict ? `&langRestrict=${langRestrict}` : '';
  // IMPORTANTE: encodeURIComponent converte ':' em '%3A', o que quebra a API do Google (Erro 503) se tiver caracteres especiais.
  const safeQuery = encodeURIComponent(query).replace(/%3A/g, ':');
  const url = `${BASE_URL}?q=${safeQuery}&maxResults=5${lang}`;

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new ApiError('api_error', `Erro na API do Google Books (${response.status}).`);
  }

  const data: GoogleBooksResponse = await response.json();
  return data.items ?? [];
}

// ISBN é universal — sem restrição de idioma para não perder resultados
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
    (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10',
  )?.identifier;

  // zoom=2 retorna imagem em resolução maior que zoom=1
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
