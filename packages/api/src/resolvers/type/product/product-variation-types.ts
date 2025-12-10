import type { Context } from '../../../context.ts';
import type {
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
    {
      _id: string;
      productVariationOption: string;
    }[]
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

  texts: async (obj, { forceLocale }, { loaders, locale }) => {
    return loaders.productVariationTextLoader.load({
      productVariationId: obj._id,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
  },
};
