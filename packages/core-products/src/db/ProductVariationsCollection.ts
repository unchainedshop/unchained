import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

export enum ProductVariationType {
  COLOR = 'COLOR',
  TEXT = 'TEXT',
}

export type ProductVariation = {
  _id: string;
  key?: string;
  tags?: string[];
  options: string[];
  productId: string;
  type: string;
} & TimestampFields;

export type ProductVariationText = {
  _id: string;
  locale: string;
  productVariationId: string;
  productVariationOptionValue: string | null;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export interface ProductVariationOption {
  _id: string;
  texts: ProductVariationText;
  value: string;
}
export const ProductVariationsCollection = async (db: mongodb.Db) => {
  const ProductVariations = db.collection<ProductVariation>('product_variations');
  const ProductVariationTexts = db.collection<ProductVariationText>('product_variation_texts');

  await buildDbIndexes(ProductVariations, [{ index: { productId: 1 } }]);

  await buildDbIndexes(ProductVariationTexts, [
    { index: { productVariationId: 1 } },
    { index: { locale: 1 } },
  ]);

  return {
    ProductVariations,
    ProductVariationTexts,
  };
};
