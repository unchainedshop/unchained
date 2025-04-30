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
    { forceLocale }: { forceLocale?: string },
    { loaders, locale }: Context,
  ) => {
    const text = await loaders.assortmentTextLoader.load({
      assortmentId: childAssortmentId,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
    return text;
  },
};
