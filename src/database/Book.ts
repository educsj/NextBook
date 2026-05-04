import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Book extends Model {
  static table = 'books';

  @text('title') title!: string;
  @text('author') author!: string;
  @field('isbn') isbn!: string | null;
  @field('cover_url') coverUrl!: string | null;
  @field('total_pages') totalPages!: number | null;
  @field('read_pages') readPages!: number;
  @field('is_read') isRead!: boolean;
  @field('is_synced') isSynced!: boolean;
  @field('rating') rating!: number | null;
  @text('notes') notes!: string | null;
}
