import { AssortmentLink } from '@unchainedshop/core-assortments';
import { Context } from '../../../context.js';

export const AssortmentPathLink = {
  link(linkObj) {
    if (linkObj._id) return linkObj;
    return null;
  },

  assortmentId(linkObj) {
    return linkObj.childAssortmentId;
  },

  assortmentTexts: async (
    { childAssortmentId }: AssortmentLink,
    params: { forceLocale?: string },
    { loaders, localeContext }: Context,
  ) => {
    const text = await loaders.assortmentTextLoader.load({
      assortmentId: childAssortmentId,
      locale: params.forceLocale || localeContext.baseName,
    });
    return text;
  },
};
