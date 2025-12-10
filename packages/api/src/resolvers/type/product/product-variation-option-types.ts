import type { Context } from '../../../context.ts';
import type { ProductVariationText } from '@unchainedshop/core-products';

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

  texts: async (obj, { forceLocale }, { loaders, locale }) => {
    return loaders.productVariationTextLoader.load({
      productVariationId: obj._id,
      productVariationOptionValue: obj.productVariationOption,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
  },
};
