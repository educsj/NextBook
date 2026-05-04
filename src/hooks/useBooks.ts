import { useState, useEffect } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Book from '../database/Book';
import type { FilterType, SortOrder } from '../store/useBookStore';

export function useBooks(filter: FilterType = 'all', search = '', sortOrder: SortOrder = 'recent') {
  const database = useDatabase();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const conditions: Q.Clause[] = [];

    if (filter === 'read') conditions.push(Q.where('is_read', true));
    if (filter === 'unread') conditions.push(Q.where('is_read', false));
    if (filter === 'borrowed') conditions.push(Q.where('borrowed_to', Q.notEq(null)));

    const sortClause: Q.SortBy = (() => {
      switch (sortOrder) {
        case 'title_asc':   return Q.sortBy('title', Q.asc);
        case 'author_asc':  return Q.sortBy('author', Q.asc);
        case 'rating_desc': return Q.sortBy('rating', Q.desc);
        default:            return Q.sortBy('created_at', Q.desc);
      }
    })();

    const subscription = database
      .get<Book>('books')
      .query(...conditions, sortClause)
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
  }, [database, filter, search, sortOrder]);

  return { books, loading };
}
