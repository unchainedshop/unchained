import { ProductMedia, ProductMediaText } from '../types.js';
import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';

export const ProductMediaCollection = async (db: mongodb.Db) => {
  const ProductMedias = db.collection<ProductMedia>('product_media');
  const ProductMediaTexts = db.collection<ProductMediaText>('product_media_texts');

  // ProductMedia Indexes
  await buildDbIndexes(ProductMedias, [
    { index: { mediaId: 1 } },
    { index: { productId: 1, sortKey: 1 } },
    { index: { tags: 1, sortKey: 1 } },
    { index: { productId: 1, tags: 1, sortKey: 1 } },
  ]);

  // ProductMediaTexts indexes
  await buildDbIndexes(ProductMediaTexts, [{ index: { productMediaId: 1 } }, { index: { locale: 1 } }]);

  return {
    ProductMedias,
    ProductMediaTexts,
  };
};
