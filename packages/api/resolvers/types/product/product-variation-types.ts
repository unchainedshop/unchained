import { ProductVariationHelperTypes } from '@unchainedshop/types/products.variations';

export const ProductVariation: ProductVariationHelperTypes = {
  options: (obj, _, { modules }) => {
    return (obj.options || []).map((option) =>
      modules.products.variations.option(obj, option)
    );
  },

  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return modules.products.variations.texts.findLocalizedVariationText({
      productVariationId: obj._id,
      locale: forceLocale || localeContext.normalized,
    });
  },
};
