import { Context } from '../../../context.js';
import {
  ProductVariation as ProductVariationType,
  ProductVariationText,
} from '@unchainedshop/core-products';

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
  options: (obj) => {
    return (obj.options || []).map((option) => ({
      _id: obj._id,
      productVariationOption: option,
    }));
  },

  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    // TODO: use loader
    return modules.products.variations.texts.findLocalizedVariationText({
      productVariationId: obj._id,
      locale: forceLocale ? new Intl.Locale(forceLocale) : localeContext,
    });
  },
};
