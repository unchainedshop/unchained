import { ProductMediaHelperTypes } from '@unchainedshop/types/products.media';

export const ProductMedia: ProductMediaHelperTypes = {
  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return await modules.products.media.texts.findLocalizedMediaText({
      productMediaId: obj._id as string,
      locale: forceLocale || localeContext.normalized,
    });
  },

  file: async (obj, _, { modules }) => {
    return await modules.files.findFile({ fileId: obj.mediaId });
  },
};
