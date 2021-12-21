import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';
import {
  Assortment,
  AssortmentText,
  AssortmentProduct,
  AssortmentLink,
  AssortmentFilter,
} from '@unchainedshop/types/assortments';

export const AssortmentsCollection = async (db: Db) => {
  const Assortments = db.collection<Assortment>('assortments');
  const AssortmentTexts = db.collection<AssortmentText>('assortment_texts');
  const AssortmentProducts = db.collection<AssortmentProduct>(
    'assortment_products'
  );
  const AssortmentLinks = db.collection<AssortmentLink>('assortment_links');
  const AssortmentFilters =
    db.collection<AssortmentFilter>('assortment_filters');

  // Assortment Indexes
  await buildDbIndexes(Assortments, [
    { index: { isActive: 1 } },
    { index: { isRoot: 1 } },
    { index: { sequence: 1 } },
    { index: { slugs: 1 } },
    { index: { tags: 1 } },
  ]);

  // AssortmentTexts indexes
  await buildDbIndexes(AssortmentTexts, [
    { index: { assortmentId: 1 } },
    { index: { locale: 1 } },
    { index: { slug: 1 } },
    { index: { locale: 1, assortmentId: 1 } },
    {
      index: { title: 'text', subtitle: 'text', vendor: 'text', brand: 'text' }, // TODO: check with Pascal
    },
  ]);

  // AssortmentProducts indexes
  await buildDbIndexes(AssortmentProducts, [
    { index: { assortmentId: 1 } },
    { index: { productId: 1 } },
    { index: { tags: 1 } },
  ]);

  // AssortmentLinks indices
  await buildDbIndexes(AssortmentLinks, [
    { index: { parentAssortmentId: 1 } },
    { index: { childAssortmentId: 1 } },
    { index: { tags: 1 } },
  ]);

  // AssortmentFilter indices
  await buildDbIndexes(AssortmentFilters, [
    { index: { assortmentId: 1 } },
    { index: { filterId: 1 } },
    { index: { tags: 1 } },
  ]);

  return {
    Assortments,
    AssortmentTexts,
    AssortmentProducts,
    AssortmentLinks,
    AssortmentFilters,
  };
};
