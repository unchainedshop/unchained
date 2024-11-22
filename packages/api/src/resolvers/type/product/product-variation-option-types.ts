import { Context } from '../../../context.js';
import { ProductVariationText } from '@unchainedshop/core-products';

export type OptionHelperType<P, T> = (
  option: { _id: string; productVariationOption: string },
  params: P,
  context: Context,
) => T;

export interface ProductVariationOptionHelperTypes {
  _id: OptionHelperType<never, string>;
  texts: OptionHelperType<{ forceLocale?: string }, Promise<ProductVariationText>>;
  value: OptionHelperType<never, string>;
}
export const ProductVariationOption: ProductVariationOptionHelperTypes = {
  _id: (obj) => {
    return `${obj._id}:${obj.productVariationOption}`;
  },
  value: (obj) => {
    return obj.productVariationOption;
  },

  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return modules.products.variations.texts.findLocalizedVariationText({
      locale: forceLocale || localeContext.baseName,
      productVariationId: obj._id,
      productVariationOptionValue: obj.productVariationOption,
    });
  },
};
