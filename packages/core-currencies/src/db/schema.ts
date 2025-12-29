import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Currencies table schema for SQLite/Turso.
 */
export const currencies = sqliteTable(
  'currencies',
  {
    _id: text('_id').primaryKey(),
    isoCode: text('isoCode').notNull().unique(),
    isActive: integer('isActive', { mode: 'boolean' }),
    contractAddress: text('contractAddress'),
    decimals: integer('decimals'),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_currencies_deleted').on(table.deleted),
    index('idx_currencies_isActive').on(table.isActive),
    index('idx_currencies_contractAddress').on(table.contractAddress),
  ],
);

/**
 * Type for selecting a currency row from the database.
 */
export type CurrencyRow = typeof currencies.$inferSelect;

/**
 * Type for inserting a new currency row into the database.
 */
export type NewCurrencyRow = typeof currencies.$inferInsert;
