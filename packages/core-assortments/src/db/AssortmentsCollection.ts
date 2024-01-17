import { buildDbIndexes, mongodb } from '@unchainedshop/mongodb';
import {
  Assortment,
  AssortmentText,
  AssortmentProduct,
  AssortmentLink,
  AssortmentFilter,
  AssortmentProductIdCacheRecord,
} from '@unchainedshop/types/assortments.js';

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
  await buildDbIndexes(Assortments, [
    { index: { isActive: 1 } },
    { index: { isRoot: 1 } },
    { index: { sequence: 1 } },
    { index: { slugs: 1 } },
    { index: { tags: 1 } },
    {
      index: { slugs: 'text' },
      options: {
        name: 'assortments_fulltext_search',
      },
    },
  ]);

  // AssortmentTexts indexes
  await buildDbIndexes(AssortmentTexts, [
    { index: { assortmentId: 1 } },
    { index: { locale: 1 } },
    { index: { slug: 1 } },
    { index: { locale: 1, assortmentId: 1 } },
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
