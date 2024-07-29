import { Context } from '@unchainedshop/api';
import { Product, ProductAssignment, ProductConfiguration } from '@unchainedshop/core-products';

export type AssignmentHelperType<T> = (
  data: { product: Product; assignment: ProductAssignment },
  _: never,
  context: Context,
) => T;

export interface ProductVariationAssignmentHelperTypes {
  _id: AssignmentHelperType<string>;
  vectors: AssignmentHelperType<Array<{ product: Product } & ProductConfiguration>>;
  product: AssignmentHelperType<Promise<Product>>;
}

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
