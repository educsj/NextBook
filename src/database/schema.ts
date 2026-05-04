import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
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
      ],
    }),
  ],
});
