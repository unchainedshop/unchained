/**
 * Drizzle ORM schema for core-products
 * Tables: products, product_texts, product_media, product_media_texts,
 *         product_variations, product_variation_texts, product_reviews, product_rates
 */

import { sqliteTable, text, integer, index, real } from 'drizzle-orm/sqlite-core';

// ============ PRODUCTS ============

export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
} as const;

export type ProductStatusType = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ProductType = {
  SIMPLE_PRODUCT: 'SIMPLE_PRODUCT',
  CONFIGURABLE_PRODUCT: 'CONFIGURABLE_PRODUCT',
  BUNDLE_PRODUCT: 'BUNDLE_PRODUCT',
  PLAN_PRODUCT: 'PLAN_PRODUCT',
  TOKENIZED_PRODUCT: 'TOKENIZED_PRODUCT',
} as const;

export type ProductTypeType = (typeof ProductType)[keyof typeof ProductType];

export const ProductContractStandard = {
  ERC721: 'ERC721',
  ERC1155: 'ERC1155',
} as const;

export type ProductContractStandardType =
  (typeof ProductContractStandard)[keyof typeof ProductContractStandard];

export interface ProductAssignment {
  vector: Record<string, string>;
  productId: string;
}

export interface ProductProxy {
  assignments: ProductAssignment[];
}

export interface ProductSupply {
  weightInGram?: number;
  heightInMillimeters?: number;
  lengthInMillimeters?: number;
  widthInMillimeters?: number;
}

export interface ProductConfiguration {
  key: string;
  value: string;
}

export interface ProductBundleItem {
  productId: string;
  quantity: number;
  configuration: ProductConfiguration[];
}

export interface ProductPrice {
  amount: number;
  currencyCode: string;
  isTaxable?: boolean;
  isNetPrice?: boolean;
  countryCode: string;
  maxQuantity?: number;
}

export interface ProductCommerce {
  salesUnit?: string;
  salesQuantityPerUnit?: string;
  defaultOrderQuantity?: number;
  pricing: ProductPrice[];
}

export interface ProductTokenization {
  contractAddress: string;
  contractStandard: ProductContractStandardType;
  tokenId: string;
  supply: number;
  ercMetadataProperties?: Record<string, any>;
}

export interface ProductPlan {
  billingInterval?: string;
  billingIntervalCount?: number;
  usageCalculationType?: string;
  trialInterval?: string;
  trialIntervalCount?: number;
}

export interface ProductWarehousing {
  baseUnit?: string;
  sku?: string;
}

export const products = sqliteTable(
  'products',
  {
    _id: text('_id').primaryKey(),
    type: text('type').notNull(), // ProductType
    status: text('status'), // null = DRAFT, or ProductStatus
    sequence: integer('sequence').notNull().default(0),
    slugs: text('slugs', { mode: 'json' }).$type<string[]>().default([]),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    published: integer('published', { mode: 'timestamp_ms' }),
    // Nested structures as JSON
    commerce: text('commerce', { mode: 'json' }).$type<ProductCommerce>(),
    bundleItems: text('bundleItems', { mode: 'json' }).$type<ProductBundleItem[]>(),
    proxy: text('proxy', { mode: 'json' }).$type<ProductProxy>(),
    supply: text('supply', { mode: 'json' }).$type<ProductSupply>(),
    warehousing: text('warehousing', { mode: 'json' }).$type<ProductWarehousing>(),
    plan: text('plan', { mode: 'json' }).$type<ProductPlan>(),
    tokenization: text('tokenization', { mode: 'json' }).$type<ProductTokenization>(),
    meta: text('meta', { mode: 'json' }),
    // Timestamps
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_products_status').on(table.status),
    index('idx_products_sequence').on(table.sequence),
    index('idx_products_deleted').on(table.deleted),
  ],
);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;

// ============ PRODUCT TEXTS ============

export const productTexts = sqliteTable(
  'product_texts',
  {
    _id: text('_id').primaryKey(),
    productId: text('productId').notNull(),
    locale: text('locale').notNull(),
    slug: text('slug'),
    title: text('title'),
    subtitle: text('subtitle'),
    description: text('description'),
    brand: text('brand'),
    vendor: text('vendor'),
    labels: text('labels', { mode: 'json' }).$type<string[]>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_product_texts_productId').on(table.productId),
    index('idx_product_texts_locale').on(table.locale),
    index('idx_product_texts_slug').on(table.slug),
    index('idx_product_texts_lookup').on(table.locale, table.productId),
  ],
);

export type ProductTextRow = typeof productTexts.$inferSelect;
export type NewProductTextRow = typeof productTexts.$inferInsert;

// ============ PRODUCT MEDIA ============

export const productMedia = sqliteTable(
  'product_media',
  {
    _id: text('_id').primaryKey(),
    mediaId: text('mediaId').notNull(),
    productId: text('productId').notNull(),
    sortKey: integer('sortKey').notNull().default(0),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    meta: text('meta', { mode: 'json' }),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_product_media_mediaId').on(table.mediaId),
    index('idx_product_media_productId').on(table.productId),
    index('idx_product_media_sortKey').on(table.productId, table.sortKey),
    index('idx_product_media_tags').on(table.productId, table.sortKey),
  ],
);

export type ProductMediaRow = typeof productMedia.$inferSelect;
export type NewProductMediaRow = typeof productMedia.$inferInsert;

// ============ PRODUCT MEDIA TEXTS ============

export const productMediaTexts = sqliteTable(
  'product_media_texts',
  {
    _id: text('_id').primaryKey(),
    productMediaId: text('productMediaId').notNull(),
    locale: text('locale').notNull(),
    title: text('title'),
    subtitle: text('subtitle'),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_product_media_texts_productMediaId').on(table.productMediaId),
    index('idx_product_media_texts_locale').on(table.locale),
  ],
);

export type ProductMediaTextRow = typeof productMediaTexts.$inferSelect;
export type NewProductMediaTextRow = typeof productMediaTexts.$inferInsert;

// ============ PRODUCT VARIATIONS ============

export const ProductVariationType = {
  COLOR: 'COLOR',
  TEXT: 'TEXT',
} as const;

export type ProductVariationTypeType = (typeof ProductVariationType)[keyof typeof ProductVariationType];

export const productVariations = sqliteTable(
  'product_variations',
  {
    _id: text('_id').primaryKey(),
    productId: text('productId').notNull(),
    key: text('key').notNull(),
    type: text('type').notNull(), // ProductVariationType
    options: text('options', { mode: 'json' }).$type<string[]>().default([]),
    tags: text('tags', { mode: 'json' }).$type<string[]>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [index('idx_product_variations_productId').on(table.productId)],
);

export type ProductVariationRow = typeof productVariations.$inferSelect;
export type NewProductVariationRow = typeof productVariations.$inferInsert;

// ============ PRODUCT VARIATION TEXTS ============

export const productVariationTexts = sqliteTable(
  'product_variation_texts',
  {
    _id: text('_id').primaryKey(),
    productVariationId: text('productVariationId').notNull(),
    productVariationOptionValue: text('productVariationOptionValue'),
    locale: text('locale').notNull(),
    title: text('title'),
    subtitle: text('subtitle'),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_product_variation_texts_variationId').on(table.productVariationId),
    index('idx_product_variation_texts_locale').on(table.locale),
  ],
);

export type ProductVariationTextRow = typeof productVariationTexts.$inferSelect;
export type NewProductVariationTextRow = typeof productVariationTexts.$inferInsert;

// ============ PRODUCT REVIEWS ============

export const ProductReviewVoteType = {
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE',
  REPORT: 'REPORT',
} as const;

export type ProductReviewVoteTypeType =
  (typeof ProductReviewVoteType)[keyof typeof ProductReviewVoteType];

export interface ProductVote {
  meta?: any;
  timestamp?: Date;
  type: ProductReviewVoteTypeType;
  userId?: string;
}

export const productReviews = sqliteTable(
  'product_reviews',
  {
    _id: text('_id').primaryKey(),
    productId: text('productId').notNull(),
    authorId: text('authorId').notNull(),
    rating: integer('rating').notNull(),
    title: text('title'),
    review: text('review'),
    meta: text('meta', { mode: 'json' }),
    votes: text('votes', { mode: 'json' }).$type<ProductVote[]>().default([]),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_product_reviews_productId').on(table.productId),
    index('idx_product_reviews_authorId').on(table.authorId),
  ],
);

export type ProductReviewRow = typeof productReviews.$inferSelect;
export type NewProductReviewRow = typeof productReviews.$inferInsert;

// ============ PRODUCT RATES ============

export const productRates = sqliteTable(
  'product_rates',
  {
    _id: text('_id').primaryKey(),
    baseCurrency: text('baseCurrency').notNull(),
    quoteCurrency: text('quoteCurrency').notNull(),
    rate: real('rate').notNull(),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }),
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_product_rates_baseCurrency').on(table.baseCurrency),
    index('idx_product_rates_quoteCurrency').on(table.quoteCurrency),
    index('idx_product_rates_expiresAt').on(table.expiresAt, table.timestamp),
  ],
);

export type ProductRateRow = typeof productRates.$inferSelect;
export type NewProductRateRow = typeof productRates.$inferInsert;
