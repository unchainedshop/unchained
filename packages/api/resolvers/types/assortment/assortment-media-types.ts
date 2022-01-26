import { Context } from '@unchainedshop/types/api';
import {
  AssortmentMedia as AssortmentMediaType,
  AssortmentMediaText,
} from '@unchainedshop/types/assortments.media';
import { File } from '@unchainedshop/types/files';

type HelperType<P, T> = (assortmentMedia: AssortmentMediaType, params: P, context: Context) => T;

export interface AssortmentMediaHelperTypes {
  texts: HelperType<{ forceLocale?: string }, Promise<AssortmentMediaText>>;
  file: HelperType<any, Promise<File>>;
}

export const AssortmentMedia: AssortmentMediaHelperTypes = {
  texts: (obj, { forceLocale }, { modules, localeContext }) =>
    modules.assortments.media.texts.findLocalizedMediaText({
      assortmentMediaId: obj._id,
      locale: forceLocale || localeContext.normalized,
    }),

  file: (obj, _, { modules }) => modules.files.findFile({ fileId: obj.mediaId }),
};
