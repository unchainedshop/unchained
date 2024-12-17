import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

export type ProductMedia = {
  _id?: string;
  mediaId: string;
  productId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
} & TimestampFields;

export type ProductMediaText = {
  _id?: string;
  productMediaId: string;
  locale?: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

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
