import {
  type TimestampFields,
  type Database,
  type FindOptions,
  toSelectOptions,
} from '@unchainedshop/sqlite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Re-export from sqlite for convenience
export { type FindOptions, toSelectOptions };

export type AssortmentProductIdCacheRecord = {
  _id: string;
  productIds: string[];
} & TimestampFields;

export type AssortmentText = {
  _id: string;
  assortmentId: string;
  description?: string;
  locale: string;
  slug?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type AssortmentProduct = {
  _id: string;
  assortmentId: string;
  meta?: any;
  productId: string;
  sortKey: number;
  tags: string[];
} & TimestampFields;

export type AssortmentLink = {
  _id: string;
  childAssortmentId: string;
  meta?: any;
  parentAssortmentId: string;
  sortKey: number;
  tags: string[];
} & TimestampFields;

export type AssortmentFilter = {
  _id: string;
  assortmentId: string;
  filterId: string;
  meta?: any;
  sortKey: number;
  tags: string[];
} & TimestampFields;

export type Assortment = {
  _id: string;
  isActive: boolean;
  isBase: boolean;
  isRoot: boolean;
  meta?: any;
  sequence: number;
  slugs?: string[];
  tags: string[];
} & TimestampFields;

export type AssortmentMediaText = {
  _id: string;
  assortmentMediaId: string;
  locale: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

export type AssortmentMediaType = {
  _id: string;
  mediaId: string;
  assortmentId: string;
  sortKey: number;
  tags: string[];
  meta?: any;
} & TimestampFields;

export interface AssortmentQuery {
  queryString?: string;
  assortmentIds?: string[];
  assortmentSelector?: Record<string, any>;
  includeInactive?: boolean;
  includeLeaves?: boolean;
  slugs?: string[];
  tags?: string[];
}

export type InvalidateCacheFn = (
  params: AssortmentQuery,
  options?: { skipUpstreamTraversal: boolean },
) => void;

// Table names as constants
export const ASSORTMENTS_TABLE = 'assortments';
export const ASSORTMENT_TEXTS_TABLE = 'assortment_texts';
export const ASSORTMENT_PRODUCTS_TABLE = 'assortment_products';
export const ASSORTMENT_LINKS_TABLE = 'assortment_links';
export const ASSORTMENT_FILTERS_TABLE = 'assortment_filters';
export const ASSORTMENT_MEDIA_TABLE = 'assortment_media';
export const ASSORTMENT_MEDIA_TEXTS_TABLE = 'assortment_media_texts';
export const ASSORTMENT_PRODUCT_ID_CACHE_TABLE = 'assortment_product_id_cache';

let schemaInitialized = false;

export const initAssortmentsSchema = (db: Database) => {
  if (schemaInitialized) return;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const schemaPath = join(__dirname, '..', '..', 'schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);
  schemaInitialized = true;
};
