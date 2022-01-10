import { Context } from '@unchainedshop/types/api';
import {
  Assortment as AssortmentType,
  AssortmentLink as AssortmentLinkType,
  AssortmentText,
} from '@unchainedshop/types/assortments';
import { Locale } from 'locale';

type HelperType<P, T> = (
  assortment: AssortmentType,
  params: P,
  context: Context
) => T;

export interface AssortmentPathLinkHelperTypes {
  link: (
    params: { assortmentId: string; childAssortmentId: string },
    _: never,
    context: Context
  ) => Promise<AssortmentLinkType>;

  assortmentSlug: HelperType<{ forceLocale?: string }, Promise<string>>;

  assortmentTexts: HelperType<
    { forceLocale?: string },
    Promise<AssortmentText>
  >;
}

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
