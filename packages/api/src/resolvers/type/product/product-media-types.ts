import { ProductMediaHelperTypes } from '@unchainedshop/types/products.media.js';

export const ProductMedia: ProductMediaHelperTypes = {
  // TODO: Loader for product media texts!
  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return modules.products.media.texts.findLocalizedMediaText({
      productMediaId: obj._id,
      locale: forceLocale || localeContext.normalized,
    });
  },

  file: async (obj, _, { modules }) => {
    // TODO: Loader
    return modules.files.findFile({ fileId: obj.mediaId });
  },
};
