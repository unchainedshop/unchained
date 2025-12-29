import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Languages table schema for SQLite/Turso.
 */
export const languages = sqliteTable(
  'languages',
  {
    _id: text('_id').primaryKey(),
    isoCode: text('isoCode').notNull().unique(),
    isActive: integer('isActive', { mode: 'boolean' }),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_languages_deleted').on(table.deleted),
    index('idx_languages_isActive').on(table.isActive),
  ],
);

/**
 * Type for selecting a language row from the database.
 */
export type LanguageRow = typeof languages.$inferSelect;

/**
 * Type for inserting a new language row into the database.
 */
export type NewLanguageRow = typeof languages.$inferInsert;
