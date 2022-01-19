import { ProductVariationAssignmentVectorHelperTypes } from '@unchainedshop/types/products.variations';
import { builtinModules } from 'module';

export const ProductVariationAssignmentVector: ProductVariationAssignmentVectorHelperTypes =
  {
    _id: ({ product, key, value }) => {
      return `${product._id}:${key}=${value}}`;
    },

    option: async (obj, _, { modules }) => {
      const productVariation =
        await modules.products.variations.findProductVariation({
          productVariationId: obj.key,
        });
      return modules.products.variations.option(productVariation, obj.value);
    },

    variation: async (obj, _, { modules }) => {
      return await modules.products.variations.findProductVariation({
        productVariationId: obj.key,
      });
    },
  };
