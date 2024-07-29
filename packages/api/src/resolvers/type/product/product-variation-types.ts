import { Context } from '@unchainedshop/api';
import {
  ProductVariation as ProductVariationType,
  ProductVariationText,
} from '@unchainedshop/types/products.variations.js';

export type HelperType<P, T> = (
  productVariation: ProductVariationType,
  params: P,
  context: Context,
) => T;

export interface ProductVariationHelperTypes {
  options: HelperType<
    never,
    Array<{
      _id: string;
      productVariationOption: string;
    }>
  >;
  texts: HelperType<{ forceLocale?: string }, Promise<ProductVariationText>>;
}
export const ProductVariation: ProductVariationHelperTypes = {
  options: (obj, _, { modules }) => {
    return (obj.options || []).map((option) => modules.products.variations.option(obj, option));
  },

  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return modules.products.variations.texts.findLocalizedVariationText({
      productVariationId: obj._id,
      locale: forceLocale || localeContext.baseName,
    });
  },
};
