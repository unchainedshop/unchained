import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const QuotationStatus = {
  REQUESTED: 'REQUESTED',
  PROCESSING: 'PROCESSING',
  PROPOSED: 'PROPOSED',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
} as const;

export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

/**
 * Quotations table schema for SQLite/Turso.
 */
export const quotations = sqliteTable(
  'quotations',
  {
    _id: text('_id').primaryKey(),
    userId: text('userId').notNull(),
    productId: text('productId').notNull(),
    countryCode: text('countryCode'),
    currencyCode: text('currencyCode'),
    quotationNumber: text('quotationNumber'),
    status: text('status'),
    price: integer('price'),
    expires: integer('expires', { mode: 'timestamp_ms' }),
    fulfilled: integer('fulfilled', { mode: 'timestamp_ms' }),
    rejected: integer('rejected', { mode: 'timestamp_ms' }),
    configuration: text('configuration', { mode: 'json' }).$type<
      { key: string; value: string }[] | null
    >(),
    context: text('context', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    log: text('log', { mode: 'json' }).$type<{ date: string; status: string; info: string }[] | null>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_quotations_userId').on(table.userId),
    index('idx_quotations_productId').on(table.productId),
    index('idx_quotations_status').on(table.status),
  ],
);

export type QuotationRow = typeof quotations.$inferSelect;
export type NewQuotationRow = typeof quotations.$inferInsert;
