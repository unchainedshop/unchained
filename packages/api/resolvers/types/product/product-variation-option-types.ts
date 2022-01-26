import { ProductVariationOptionHelperTypes } from '@unchainedshop/types/products.variations';

export const ProductVariationOption: ProductVariationOptionHelperTypes = {
  _id: (obj) => {
    return `${obj._id}:${obj.productVariationOption}`;
  },
  value: (obj) => {
    return obj.productVariationOption;
  },

  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return modules.products.variations.texts.findLocalizedVariationText({
      locale: forceLocale || localeContext.normalized,
      productVariationId: obj._id,
      productVariationOptionValue: obj.productVariationOption,
    });
  },
};
