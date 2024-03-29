import { ProductVariationAssignmentHelperTypes } from '@unchainedshop/types/products.variations.js';

export const ProductVariationAssignment: ProductVariationAssignmentHelperTypes = {
  _id: ({ product, assignment }) => {
    return `${product._id}:${Object.values(assignment.vector).join('-')}`;
  },
  vectors: ({ assignment, product }) => {
    return Object.keys(assignment.vector || {}).map((key) => ({
      key,
      value: assignment.vector[key],
      product,
    }));
  },
  product: async ({ assignment }, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: assignment.productId,
    });
    return product;
  },
};
