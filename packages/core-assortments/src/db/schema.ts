import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Assortments
export const assortments = sqliteTable(
  'assortments',
  {
    _id: text('_id').primaryKey(),
    isActive: integer('isActive', { mode: 'boolean' }).default(false),
    isRoot: integer('isRoot', { mode: 'boolean' }).default(false),
    sequence: integer('sequence').notNull(),
    slugs: text('slugs', { mode: 'json' }).$type<string[]>().default([]),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_assortments_deleted').on(table.deleted),
    index('idx_assortments_isActive').on(table.isActive),
    index('idx_assortments_isRoot').on(table.isRoot),
    index('idx_assortments_sequence').on(table.sequence),
  ],
);

export type Assortment = typeof assortments.$inferSelect;
export type NewAssortment = typeof assortments.$inferInsert;

// Assortment Texts
export const assortmentTexts = sqliteTable(
  'assortment_texts',
  {
    _id: text('_id').primaryKey(),
    assortmentId: text('assortmentId').notNull(),
    locale: text('locale').notNull(),
    title: text('title'),
    subtitle: text('subtitle'),
    description: text('description'),
    slug: text('slug'),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_assortment_texts_assortmentId').on(table.assortmentId),
    index('idx_assortment_texts_locale').on(table.locale),
    index('idx_assortment_texts_lookup').on(table.assortmentId, table.locale),
    index('idx_assortment_texts_slug').on(table.slug),
  ],
);

export type AssortmentText = typeof assortmentTexts.$inferSelect;
export type NewAssortmentText = typeof assortmentTexts.$inferInsert;

// Assortment Products
export const assortmentProducts = sqliteTable(
  'assortment_products',
  {
    _id: text('_id').primaryKey(),
    assortmentId: text('assortmentId').notNull(),
    productId: text('productId').notNull(),
    sortKey: integer('sortKey').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_assortment_products_assortmentId').on(table.assortmentId),
    index('idx_assortment_products_productId').on(table.productId),
    index('idx_assortment_products_sort').on(table.assortmentId, table.sortKey),
  ],
);

export type AssortmentProduct = typeof assortmentProducts.$inferSelect;
export type NewAssortmentProduct = typeof assortmentProducts.$inferInsert;

// Assortment Links
export const assortmentLinks = sqliteTable(
  'assortment_links',
  {
    _id: text('_id').primaryKey(),
    parentAssortmentId: text('parentAssortmentId').notNull(),
    childAssortmentId: text('childAssortmentId').notNull(),
    sortKey: integer('sortKey').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_assortment_links_parent').on(table.parentAssortmentId),
    index('idx_assortment_links_child').on(table.childAssortmentId),
    index('idx_assortment_links_parent_sort').on(table.parentAssortmentId, table.sortKey),
    uniqueIndex('idx_assortment_links_unique').on(table.parentAssortmentId, table.childAssortmentId),
  ],
);

export type AssortmentLink = typeof assortmentLinks.$inferSelect;
export type NewAssortmentLink = typeof assortmentLinks.$inferInsert;

// Assortment Filters
export const assortmentFilters = sqliteTable(
  'assortment_filters',
  {
    _id: text('_id').primaryKey(),
    assortmentId: text('assortmentId').notNull(),
    filterId: text('filterId').notNull(),
    sortKey: integer('sortKey').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_assortment_filters_assortmentId').on(table.assortmentId),
    index('idx_assortment_filters_filterId').on(table.filterId),
    index('idx_assortment_filters_sort').on(table.assortmentId, table.sortKey),
  ],
);

export type AssortmentFilter = typeof assortmentFilters.$inferSelect;
export type NewAssortmentFilter = typeof assortmentFilters.$inferInsert;

// Assortment Product ID Cache
export const assortmentProductIdCache = sqliteTable('assortment_productId_cache', {
  _id: text('_id').primaryKey(),
  productIds: text('productIds', { mode: 'json' }).$type<string[]>().default([]),
  created: integer('created', { mode: 'timestamp_ms' }).notNull(),
  updated: integer('updated', { mode: 'timestamp_ms' }),
});

export type AssortmentProductIdCacheRecord = typeof assortmentProductIdCache.$inferSelect;
export type NewAssortmentProductIdCacheRecord = typeof assortmentProductIdCache.$inferInsert;

// Assortment Media
export const assortmentMedia = sqliteTable(
  'assortment_media',
  {
    _id: text('_id').primaryKey(),
    assortmentId: text('assortmentId').notNull(),
    mediaId: text('mediaId').notNull(),
    sortKey: integer('sortKey').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_assortment_media_mediaId').on(table.mediaId),
    index('idx_assortment_media_sort').on(table.assortmentId, table.sortKey),
    index('idx_assortment_media_assortmentId').on(table.assortmentId),
  ],
);

export type AssortmentMediaType = typeof assortmentMedia.$inferSelect;
export type NewAssortmentMedia = typeof assortmentMedia.$inferInsert;

// Assortment Media Texts
export const assortmentMediaTexts = sqliteTable(
  'assortment_media_texts',
  {
    _id: text('_id').primaryKey(),
    assortmentMediaId: text('assortmentMediaId').notNull(),
    locale: text('locale').notNull(),
    title: text('title'),
    subtitle: text('subtitle'),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_assortment_media_texts_mediaId').on(table.assortmentMediaId),
    index('idx_assortment_media_texts_locale').on(table.locale),
  ],
);

export type AssortmentMediaText = typeof assortmentMediaTexts.$inferSelect;
export type NewAssortmentMediaText = typeof assortmentMediaTexts.$inferInsert;
