import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Bookmarks table schema for SQLite/Turso.
 */
export const bookmarks = sqliteTable(
  'bookmarks',
  {
    _id: text('_id').primaryKey(),
    userId: text('userId').notNull(),
    productId: text('productId').notNull(),
    meta: text('meta'), // JSON stored as text
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_bookmarks_userId').on(table.userId),
    index('idx_bookmarks_productId').on(table.productId),
  ],
);

/**
 * Type for selecting a bookmark row from the database.
 */
export type BookmarkRow = typeof bookmarks.$inferSelect;

/**
 * Type for inserting a new bookmark row into the database.
 */
export type NewBookmarkRow = typeof bookmarks.$inferInsert;
