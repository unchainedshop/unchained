import { Context } from '../../../context.js';
import { File } from '@unchainedshop/core-files';
import { ProductMedia as ProductMediaType, ProductMediaText } from '@unchainedshop/core-products';

export type HelperType<P, T> = (productMedia: ProductMediaType, params: P, context: Context) => T;

export interface ProductMediaHelperTypes {
  texts: HelperType<{ forceLocale?: string }, Promise<ProductMediaText>>;
  file: HelperType<never, Promise<File>>;
}

export const ProductMedia: ProductMediaHelperTypes = {
  async texts(obj, { forceLocale }, requestContext) {
    const { locale, loaders } = requestContext;
    return loaders.productMediaTextLoader.load({
      productMediaId: obj._id,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
  },

  async file(obj, _, requestContext) {
    const { loaders } = requestContext;
    return loaders.fileLoader.load({
      fileId: obj.mediaId,
    });
  },
};
