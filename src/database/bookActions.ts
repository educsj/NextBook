import { Database } from '@nozbe/watermelondb';
import Book from './Book';
import type { BookData } from '../types/book';

export async function addBook(database: Database, data: BookData): Promise<Book> {
  return database.write(async () => {
    return database.get<Book>('books').create((book) => {
      book.title = data.title;
      book.author = data.author;
      book.isbn = data.isbn ?? null;
      book.coverUrl = data.coverUrl ?? null;
      book.totalPages = data.totalPages ?? null;
      book.readPages = data.readPages;
      book.isRead = data.isRead;
      book.isSynced = false;
      book.rating = data.rating ?? null;
      book.notes = data.notes ?? null;
    });
  });
}

export async function updateBookProgress(
  database: Database,
  book: Book,
  readPages: number,
): Promise<void> {
  await database.write(async () => {
    await book.update((b) => {
      b.readPages = readPages;
      b.isRead = book.totalPages !== null && readPages >= book.totalPages;
      b.isSynced = false;
    });
  });
}

export async function updateBookDetails(
  database: Database,
  book: Book,
  updates: { readPages?: number; totalPages?: number | null; rating?: number | null; notes?: string; isRead?: boolean; publisher?: string; genre?: string },
): Promise<void> {
  await database.write(async () => {
    await book.update((b) => {
      if (updates.readPages !== undefined) b.readPages = updates.readPages;
      if (updates.totalPages !== undefined) b.totalPages = updates.totalPages;
      if (updates.rating !== undefined) b.rating = updates.rating;
      if (updates.notes !== undefined) b.notes = updates.notes;
      if (updates.isRead !== undefined) b.isRead = updates.isRead;
      if (updates.publisher !== undefined) b.publisher = updates.publisher || null;
      if (updates.genre !== undefined) b.genre = updates.genre || null;
      b.isSynced = false;
    });
  });
}

export async function deleteBook(database: Database, book: Book): Promise<void> {
  await database.write(async () => {
    await book.markAsDeleted();
  });
}

export async function lendBook(database: Database, book: Book, borrowerName: string): Promise<void> {
  await database.write(async () => {
    await book.update((b) => {
      b.borrowedTo = borrowerName.trim();
      b.borrowedAt = Date.now();
      b.isSynced = false;
    });
  });
}

export async function returnBook(database: Database, book: Book): Promise<void> {
  await database.write(async () => {
    await book.update((b) => {
      b.borrowedTo = null;
      b.borrowedAt = null;
      b.isSynced = false;
    });
  });
}
