import {
  buildDbIndexes,
  isDocumentDBCompatModeEnabled,
  mongodb,
  type TimestampFields,
} from '@unchainedshop/mongodb';

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
  isRoot: boolean;
  meta?: any;
  sequence: number;
  slugs?: string[];
  tags: string[];
} & TimestampFields;

export interface AssortmentQuery {
  queryString?: string;
  assortmentIds?: string[];
  assortmentSelector?: mongodb.Filter<Assortment>;
  includeInactive?: boolean;
  includeLeaves?: boolean;
  slugs?: string[];
  tags?: string[];
}

export type InvalidateCacheFn = (
  params: AssortmentQuery,
  options?: { skipUpstreamTraversal: boolean },
) => void;

export const AssortmentsCollection = async (db: mongodb.Db) => {
  const Assortments = db.collection<Assortment>('assortments');
  const AssortmentTexts = db.collection<AssortmentText>('assortment_texts');
  const AssortmentProducts = db.collection<AssortmentProduct>('assortment_products');
  const AssortmentLinks = db.collection<AssortmentLink>('assortment_links');
  const AssortmentFilters = db.collection<AssortmentFilter>('assortment_filters');
  const AssortmentProductIdCache = db.collection<AssortmentProductIdCacheRecord>(
    'assortment_productId_cache',
  );

  // Assortment Indexes

  if (!isDocumentDBCompatModeEnabled()) {
    // Text indexes are not supported in DocumentDB
    // Assortments full-text search index
    // Note: This index is only created if not in DocumentDB compatibility mode
    await buildDbIndexes(Assortments, [
      {
        index: { slugs: 'text' },
        options: {
          name: 'assortments_fulltext_search',
        },
      },
    ]);
  }

  await buildDbIndexes(Assortments, [
    { index: { isActive: 1 } },
    { index: { isRoot: 1 } },
    { index: { sequence: 1 } },
    { index: { slugs: 1 } },
    { index: { tags: 1 } },
  ]);

  // AssortmentTexts indexes

  if (!isDocumentDBCompatModeEnabled()) {
    await buildDbIndexes(AssortmentTexts, [
      {
        index: { title: 'text', subtitle: 'text' },
        options: {
          weights: {
            title: 8,
            subtitle: 6,
          },
          name: 'assortments_texts_fulltext_search',
        },
      },
    ]);
  }

  await buildDbIndexes(AssortmentTexts, [
    { index: { assortmentId: 1 } },
    { index: { locale: 1 } },
    { index: { slug: 1 } },
    { index: { locale: 1, assortmentId: 1 } },
  ]);

  // AssortmentProducts indexes
  await buildDbIndexes(AssortmentProducts, [
    { index: { assortmentId: 1 } },
    { index: { productId: 1 } },
    { index: { tags: 1 } },
    { index: { assortmentId: 1, sortKey: 1 } },
  ]);

  // AssortmentLinks indices
  await buildDbIndexes(AssortmentLinks, [
    { index: { parentAssortmentId: 1 } },
    { index: { childAssortmentId: 1 } },
    { index: { tags: 1 } },
    { index: { parentAssortmentId: 1, sortKey: 1 } },
    { index: { childAssortmentId: 1, parentAssortmentId: 1, sortKey: 1 } },
  ]);

  // AssortmentFilter indices
  await buildDbIndexes(AssortmentFilters, [
    { index: { assortmentId: 1 } },
    { index: { filterId: 1 } },
    { index: { tags: 1 } },
    { index: { assortmentId: 1, sortKey: 1 } },
  ]);

  return {
    Assortments,
    AssortmentTexts,
    AssortmentProducts,
    AssortmentLinks,
    AssortmentFilters,
    AssortmentProductIdCache,
  };
};
