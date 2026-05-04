import { useState, useEffect } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import Book from '../database/Book';

export function useBook(id: string) {
  const database = useDatabase();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;

    database
      .get<Book>('books')
      .find(id)
      .then((found) => {
        sub = found.observe().subscribe((updated) => {
          setBook(updated);
          setLoading(false);
        });
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });

    return () => sub?.unsubscribe();
  }, [database, id]);

  return { book, loading, error };
}
