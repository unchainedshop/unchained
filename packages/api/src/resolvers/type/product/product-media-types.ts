import { ProductMediaHelperTypes } from '@unchainedshop/types/products.media.js';

export const ProductMedia: ProductMediaHelperTypes = {
  async texts(obj, { forceLocale }, requestContext) {
    const { localeContext, loaders } = requestContext;
    return loaders.productMediaTextLoader.load({
      productMediaId: obj._id,
      locale: forceLocale || localeContext.normalized,
    });
  },

  async file(obj, _, requestContext) {
    const { loaders } = requestContext;
    return loaders.fileLoader.load({
      fileId: obj.mediaId,
    });
  },
};
