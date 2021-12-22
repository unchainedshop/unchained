import { AssortmentMediaHelperTypes } from '@unchainedshop/types/assortments.media';

export const AssortmentMedia: AssortmentMediaHelperTypes = {
  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return await modules.assortments.media.texts.findLocalizedMediaText({
      assortmentMediaId: obj._id as string,
      locale: forceLocale || localeContext.normalized,
    });
  },

  file: async (obj, _, { modules }) => {
    return await modules.files.findFile({ fileId: obj.mediaId });
  },
};
