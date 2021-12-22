import { AssortmentPathLinkHelperTypes } from '@unchainedshop/types/assortments';
import { Locale } from 'locale';

export const AssortmentPathLink: AssortmentPathLinkHelperTypes = {
  link: async ({ assortmentId, childAssortmentId }, _, { modules }) => {
    return await modules.assortments.links.findLink({
      parentAssortmentId: assortmentId,
      childAssortmentId,
    });
  },

  assortmentSlug: async (obj, params, { modules, localeContext }) => {
    const locale = new Locale(params.forceLocale || localeContext.normalized);
    const text = await modules.assortments.texts.findLocalizedText({
      assortmentId: obj._id as string,
      locale,
    });

    return text.slug;
  },

  assortmentTexts: async (obj, params, { modules, localeContext }) => {
    const locale = new Locale(params.forceLocale || localeContext.normalized);
    return await modules.assortments.texts.findLocalizedText({
      assortmentId: obj._id as string,
      locale,
    });
  },
};
