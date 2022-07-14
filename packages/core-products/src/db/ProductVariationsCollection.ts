import { ProductVariation, ProductVariationText } from '@unchainedshop/types/products.variations';
import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from '@unchainedshop/utils';

export const ProductVariationsCollection = async (db: Db) => {
  const ProductVariations = db.collection<ProductVariation>('product_variations');
  const ProductVariationTexts = db.collection<ProductVariationText>('product_variation_texts');

  // ProductVariation Indexes
  await buildDbIndexes(ProductVariations, [{ index: { productId: 1 } }]);

  // ProductVariationTexts indexes
  await buildDbIndexes(ProductVariationTexts, [
    { index: { productVariationId: 1 } },
    { index: { locale: 1 } },
  ]);

  return {
    ProductVariations,
    ProductVariationTexts,
  };
};
