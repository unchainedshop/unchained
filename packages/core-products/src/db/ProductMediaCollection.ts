import {
  ProductMedia,
  ProductMediaText,
} from '@unchainedshop/types/products.media';
import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const ProductMediaCollection = async (db: Db) => {
  const ProductMedia = db.collection<ProductMedia>('product_media');
  const ProductMediaTexts = db.collection<ProductMediaText>(
    'product_media_texts'
  );

  // ProductMedia Indexes
  await buildDbIndexes(ProductMedia, [
    { index: { mediaId: 1 } },
    { index: { productId: 1 } },
    { index: { tags: 1 } },
  ]);

  // ProductMediaTexts indexes
  await buildDbIndexes(ProductMediaTexts, [
    { index: { productMediaId: 1 } },
    { index: { locale: 1 } },
  ]);

  return {
    ProductMedia,
    ProductMediaTexts,
  };
};
