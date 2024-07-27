import { Context } from '../../../types.js';
import { AssortmentMediaType, AssortmentMediaText } from '@unchainedshop/core-assortments';
import { File } from '@unchainedshop/types/files.js';

type HelperType<P, T> = (assortmentMedia: AssortmentMediaType, params: P, context: Context) => T;

export interface AssortmentMediaHelperTypes {
  texts: HelperType<{ forceLocale?: string }, Promise<AssortmentMediaText>>;
  file: HelperType<any, Promise<File>>;
}

export const AssortmentMedia: AssortmentMediaHelperTypes = {
  async texts(obj, { forceLocale }, requestContext) {
    const { localeContext, loaders } = requestContext;
    return loaders.assortmentMediaTextLoader.load({
      assortmentMediaId: obj._id,
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
