import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Countries table schema for SQLite/Turso.
 */
export const countries = sqliteTable(
  'countries',
  {
    _id: text('_id').primaryKey(),
    isoCode: text('isoCode').notNull().unique(),
    isActive: integer('isActive', { mode: 'boolean' }),
    defaultCurrencyCode: text('defaultCurrencyCode'),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_countries_deleted').on(table.deleted),
    index('idx_countries_isActive').on(table.isActive),
  ],
);

/**
 * Type for selecting a country row from the database.
 */
export type CountryRow = typeof countries.$inferSelect;

/**
 * Type for inserting a new country row into the database.
 */
export type NewCountryRow = typeof countries.$inferInsert;
