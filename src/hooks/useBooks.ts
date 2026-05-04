import { useState, useEffect } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Book from '../database/Book';

type Filter = 'all' | 'read' | 'unread';

export function useBooks(filter: Filter = 'all', search = '') {
  const database = useDatabase();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const conditions = [];

    if (filter === 'read') conditions.push(Q.where('is_read', true));
    if (filter === 'unread') conditions.push(Q.where('is_read', false));

    const subscription = database
      .get<Book>('books')
      .query(...conditions)
      .observe()
      .subscribe((result) => {
        const term = search.trim().toLowerCase();
        const filtered = term
          ? result.filter(
              (b) =>
                b.title.toLowerCase().includes(term) ||
                b.author.toLowerCase().includes(term),
            )
          : result;
        setBooks(filtered);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [database, filter, search]);

  return { books, loading };
}
