import { ProductMediaHelperTypes } from '@unchainedshop/types/products.media';

export const ProductMedia: ProductMediaHelperTypes = {
  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return modules.products.media.texts.findLocalizedMediaText({
      productMediaId: obj._id,
      locale: forceLocale || localeContext.normalized,
    });
  },

  file: async (obj, _, { modules }) => {
    return modules.files.findFile({ fileId: obj.mediaId });
  },
};
