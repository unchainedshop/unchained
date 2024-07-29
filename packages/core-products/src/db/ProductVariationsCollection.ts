import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { ProductVariation, ProductVariationText } from '../types.js';

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
