import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const FilterType = {
  SWITCH: 'SWITCH',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTI_CHOICE: 'MULTI_CHOICE',
  RANGE: 'RANGE',
} as const;

export type FilterType = (typeof FilterType)[keyof typeof FilterType];

export const filters = sqliteTable(
  'filters',
  {
    _id: text('_id').primaryKey(),
    key: text('key').notNull(),
    type: text('type').notNull().$type<FilterType>(),
    isActive: integer('isActive', { mode: 'boolean' }),
    options: text('options', { mode: 'json' }).$type<string[]>().default([]),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('idx_filters_key').on(table.key),
    index('idx_filters_isActive').on(table.isActive),
  ],
);

export type Filter = typeof filters.$inferSelect;
export type NewFilter = typeof filters.$inferInsert;

export const filterTexts = sqliteTable(
  'filter_texts',
  {
    _id: text('_id').primaryKey(),
    filterId: text('filterId').notNull(),
    filterOptionValue: text('filterOptionValue'),
    locale: text('locale').notNull(),
    title: text('title'),
    subtitle: text('subtitle'),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_filter_texts_filterId').on(table.filterId),
    index('idx_filter_texts_filterOptionValue').on(table.filterOptionValue),
    index('idx_filter_texts_lookup').on(table.filterId, table.filterOptionValue, table.locale),
  ],
);

export type FilterText = typeof filterTexts.$inferSelect;
export type NewFilterText = typeof filterTexts.$inferInsert;

export const filterProductIdCache = sqliteTable(
  'filter_productId_cache',
  {
    _id: text('_id').primaryKey(),
    filterId: text('filterId').notNull(),
    filterOptionValue: text('filterOptionValue'),
    productIds: text('productIds', { mode: 'json' }).$type<string[]>(),
    hash: text('hash'),
  },
  (table) => [
    index('idx_filter_cache_filterId').on(table.filterId),
    index('idx_filter_cache_lookup').on(table.filterId, table.filterOptionValue),
  ],
);

export type FilterProductIdCacheRecord = typeof filterProductIdCache.$inferSelect;
export type NewFilterProductIdCacheRecord = typeof filterProductIdCache.$inferInsert;
