import { Context } from '@unchainedshop/api';
import {
  AssortmentPathLink as AssortmentPathLinkType,
  AssortmentLink as AssortmentLinkType,
  AssortmentText,
} from '@unchainedshop/types/assortments.js';

type HelperType<P, T> = (assortmentPathLink: AssortmentPathLinkType, params: P, context: Context) => T;

export interface AssortmentPathLinkHelperTypes {
  link: HelperType<never, Promise<AssortmentLinkType>>;
  assortmentTexts: HelperType<{ forceLocale?: string }, Promise<AssortmentText>>;
}

export const AssortmentPathLink: AssortmentPathLinkHelperTypes = {
  link: async ({ assortmentId, childAssortmentId }, _, { loaders }) => {
    return loaders.assortmentLinkLoader.load({
      parentAssortmentId: assortmentId,
      childAssortmentId,
    });
  },

  assortmentTexts: async ({ assortmentId }, params, { loaders, localeContext }) => {
    const text = await loaders.assortmentTextLoader.load({
      assortmentId,
      locale: params.forceLocale || localeContext.normalized,
    });
    return text;
  },
};
