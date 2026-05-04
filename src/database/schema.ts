import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: 'books',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'author', type: 'string' },
        { name: 'isbn', type: 'string', isOptional: true },
        { name: 'cover_url', type: 'string', isOptional: true },
        { name: 'total_pages', type: 'number', isOptional: true },
        { name: 'read_pages', type: 'number' },
        { name: 'is_read', type: 'boolean' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'rating', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'borrowed_to', type: 'string', isOptional: true },
        { name: 'borrowed_at', type: 'number', isOptional: true },
        { name: 'publisher', type: 'string', isOptional: true },
        { name: 'genre', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
