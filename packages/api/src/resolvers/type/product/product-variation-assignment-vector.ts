import { Context } from '../../../context.js';
import { Product, ProductConfiguration } from '@unchainedshop/core-products';
import { ProductVariation } from '@unchainedshop/core-products';

export type AssignmentVectorHelperType<T> = (
  data: { product: Product } & ProductConfiguration,
  _: never,
  context: Context,
) => T;

export interface ProductVariationAssignmentVectorHelperTypes {
  _id: AssignmentVectorHelperType<string>;
  option: AssignmentVectorHelperType<Promise<{ _id: string; productVariationOption: string }>>;
  variation: AssignmentVectorHelperType<Promise<ProductVariation>>;
}

export const ProductVariationAssignmentVector: ProductVariationAssignmentVectorHelperTypes = {
  _id: ({ product, key, value }) => `${product._id}:${key}=${value}`,

  option: async (obj, _, { modules }) => {
    const productVariation = await modules.products.variations.findProductVariationByKey({
      key: obj.key,
      productId: obj.product._id,
    });
    return {
      _id: productVariation._id,
      productVariationOption: obj.value,
    };
  },

  variation: (obj, _, { modules }) => {
    return modules.products.variations.findProductVariationByKey({
      productId: obj?.product?._id,
      key: obj?.key,
    });
  },
};
