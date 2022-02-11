import { ProductVariationAssignmentVectorHelperTypes } from '@unchainedshop/types/products.variations';

export const ProductVariationAssignmentVector: ProductVariationAssignmentVectorHelperTypes = {
  _id: ({ product, key, value }) => `${product._id}:${key}=${value}}`,

  option: async (obj, _, { modules }) => {
    const productVariation = await modules.products.variations.findProductVariationByKey({
      key: obj.key,
      productId: obj.product._id
    });
    return modules.products.variations.option(productVariation, obj.value);
  },

  variation: (obj, _, { modules }) =>
    modules.products.variations.findProductVariation({
      productVariationId: obj.key,
    }),
};
