import { Context } from '@unchainedshop/types/api';
import {
  AssortmentPathLink as AssortmentPathLinkType,
  AssortmentLink as AssortmentLinkType,
  AssortmentText,
} from '@unchainedshop/types/assortments';

type HelperType<P, T> = (assortmentPathLink: AssortmentPathLinkType, params: P, context: Context) => T;

export interface AssortmentPathLinkHelperTypes {
  link: HelperType<never, Promise<AssortmentLinkType>>;

  assortmentSlug: HelperType<{ forceLocale?: string }, Promise<string>>;

  assortmentTexts: HelperType<{ forceLocale?: string }, Promise<AssortmentText>>;
}

export const AssortmentPathLink: AssortmentPathLinkHelperTypes = {
  link: async ({ assortmentId, childAssortmentId }, _, { modules }) => {
    // TODO: Loader
    return modules.assortments.links.findLink({
      parentAssortmentId: assortmentId,
      childAssortmentId,
    });
  },

  assortmentSlug: async ({ assortmentId }, params, { loaders, localeContext }) => {
    const text = await loaders.assortmentTextLoader.load({
      assortmentId,
      locale: params.forceLocale || localeContext.normalized,
    });
    return text.slug;
  },

  assortmentTexts: async ({ assortmentId }, params, { loaders, localeContext }) => {
    const text = await loaders.assortmentTextLoader.load({
      assortmentId,
      locale: params.forceLocale || localeContext.normalized,
    });
    return text;
  },
};
