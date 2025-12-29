import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Media objects table schema for SQLite/Turso.
 */
export const mediaObjects = sqliteTable(
  'media_objects',
  {
    _id: text('_id').primaryKey(),
    path: text('path').notNull(),
    name: text('name').notNull(),
    size: integer('size'),
    type: text('type'),
    url: text('url'),
    expires: integer('expires', { mode: 'timestamp_ms' }),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_media_objects_url').on(table.url),
    index('idx_media_objects_expires').on(table.expires),
    index('idx_media_objects_created').on(table.created),
  ],
);

export type MediaObjectRow = typeof mediaObjects.$inferSelect;
export type NewMediaObjectRow = typeof mediaObjects.$inferInsert;
