import { Context } from '@unchainedshop/types/api.js';
import {
  AssortmentMedia as AssortmentMediaType,
  AssortmentMediaText,
} from '@unchainedshop/types/assortments.media.js';
import { File } from '@unchainedshop/types/files.js';

type HelperType<P, T> = (assortmentMedia: AssortmentMediaType, params: P, context: Context) => T;

export interface AssortmentMediaHelperTypes {
  texts: HelperType<{ forceLocale?: string }, Promise<AssortmentMediaText>>;
  file: HelperType<any, Promise<File>>;
}

export const AssortmentMedia: AssortmentMediaHelperTypes = {
  // TODO: Loader for assortment media texts!
  texts: (obj, { forceLocale }, { modules, localeContext }) =>
    modules.assortments.media.texts.findLocalizedMediaText({
      assortmentMediaId: obj._id,
      locale: forceLocale || localeContext.normalized,
    }),

  // TODO: Loader for files!
  file: (obj, _, { modules }) => modules.files.findFile({ fileId: obj.mediaId }),
};
