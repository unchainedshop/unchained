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

// Domain interface with undefined for optional fields
export interface Product {
  _id: string;
  type: string;
  status: string | null;
  sequence: number;
  slugs: string[];
  tags: string[];
  published?: Date;
  commerce?: ProductCommerce;
  bundleItems?: ProductBundleItem[];
  proxy?: ProductProxy;
  supply?: ProductSupply;
  warehousing?: ProductWarehousing;
  plan?: ProductPlan;
  tokenization?: ProductTokenization;
  meta?: Record<string, unknown>;
  created: Date;
  updated?: Date;
  deleted?: Date;
}

export const rowToProduct = (row: ProductRow): Product => ({
  _id: row._id,
  type: row.type,
  status: row.status,
  sequence: row.sequence,
  slugs: row.slugs ?? [],
  tags: row.tags ?? [],
  published: row.published ?? undefined,
  commerce: row.commerce ?? undefined,
  bundleItems: row.bundleItems ?? undefined,
  proxy: row.proxy ?? undefined,
  supply: row.supply ?? undefined,
  warehousing: row.warehousing ?? undefined,
  plan: row.plan ?? undefined,
  tokenization: row.tokenization ?? undefined,
  meta: (row.meta as Record<string, unknown>) ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? undefined,
});

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

// Domain interface with undefined for optional fields
export interface ProductText {
  _id: string;
  productId: string;
  locale: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  brand?: string;
  vendor?: string;
  labels?: string[];
  created: Date;
  updated?: Date;
}

export const rowToProductText = (row: ProductTextRow): ProductText => ({
  _id: row._id,
  productId: row.productId,
  locale: row.locale,
  slug: row.slug ?? undefined,
  title: row.title ?? undefined,
  subtitle: row.subtitle ?? undefined,
  description: row.description ?? undefined,
  brand: row.brand ?? undefined,
  vendor: row.vendor ?? undefined,
  labels: row.labels ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

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

// Domain interface with undefined for optional fields
export interface ProductMedia {
  _id: string;
  mediaId: string;
  productId: string;
  sortKey: number;
  tags: string[];
  meta?: Record<string, unknown>;
  created: Date;
  updated?: Date;
}

export const rowToProductMedia = (row: ProductMediaRow): ProductMedia => ({
  _id: row._id,
  mediaId: row.mediaId,
  productId: row.productId,
  sortKey: row.sortKey,
  tags: row.tags ?? [],
  meta: (row.meta as Record<string, unknown>) ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

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

// Domain interface with undefined for optional fields
export interface ProductMediaText {
  _id: string;
  productMediaId: string;
  locale: string;
  title?: string;
  subtitle?: string;
  created: Date;
  updated?: Date;
}

export const rowToProductMediaText = (row: ProductMediaTextRow): ProductMediaText => ({
  _id: row._id,
  productMediaId: row.productMediaId,
  locale: row.locale,
  title: row.title ?? undefined,
  subtitle: row.subtitle ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

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

// Domain interface with undefined for optional fields
export interface ProductVariation {
  _id: string;
  productId: string;
  key: string;
  type: string;
  options: string[];
  tags?: string[];
  created: Date;
  updated?: Date;
}

export const rowToProductVariation = (row: ProductVariationRow): ProductVariation => ({
  _id: row._id,
  productId: row.productId,
  key: row.key,
  type: row.type,
  options: row.options ?? [],
  tags: row.tags ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

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

// Domain interface with undefined for optional fields
export interface ProductVariationText {
  _id: string;
  productVariationId: string;
  productVariationOptionValue?: string;
  locale: string;
  title?: string;
  subtitle?: string;
  created: Date;
  updated?: Date;
}

export const rowToProductVariationText = (row: ProductVariationTextRow): ProductVariationText => ({
  _id: row._id,
  productVariationId: row.productVariationId,
  productVariationOptionValue: row.productVariationOptionValue ?? undefined,
  locale: row.locale,
  title: row.title ?? undefined,
  subtitle: row.subtitle ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

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

// Domain interface with undefined for optional fields
export interface ProductReview {
  _id: string;
  productId: string;
  authorId: string;
  rating: number;
  title?: string;
  review?: string;
  meta?: Record<string, unknown>;
  votes: ProductVote[];
  created: Date;
  updated?: Date;
  deleted?: Date;
}

export const rowToProductReview = (row: ProductReviewRow): ProductReview => ({
  _id: row._id,
  productId: row.productId,
  authorId: row.authorId,
  rating: row.rating,
  title: row.title ?? undefined,
  review: row.review ?? undefined,
  meta: (row.meta as Record<string, unknown>) ?? undefined,
  votes: row.votes ?? [],
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? undefined,
});

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

// Domain interface with undefined for optional fields
export interface ProductRate {
  _id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  expiresAt?: Date;
  timestamp?: Date;
}

export const rowToProductRate = (row: ProductRateRow): ProductRate => ({
  _id: row._id,
  baseCurrency: row.baseCurrency,
  quoteCurrency: row.quoteCurrency,
  rate: row.rate,
  expiresAt: row.expiresAt ?? undefined,
  timestamp: row.timestamp ?? undefined,
});
