import { Context } from '@unchainedshop/types/api';
import { Assortment, AssortmentLink as AssortmentLinkType } from '@unchainedshop/types/assortments';

type HelperType<T> = (assortmentLink: AssortmentLinkType, _: never, context: Context) => T;

export type AssortmentLinkHelperTypes = {
  child: HelperType<Promise<Assortment>>;
  parent: HelperType<Promise<Assortment>>;
};

export const AssortmentLink: AssortmentLinkHelperTypes = {
  child: async (obj, _, { loaders }) => {
    const assortment = await loaders.assortmentLoader.load({
      assortmentId: obj.childAssortmentId,
      includeInactive: true,
    });
    return assortment;
  },

  parent: async (obj, _, { loaders }) => {
    const assortment = await loaders.assortmentLoader.load({
      assortmentId: obj.parentAssortmentId,
      includeInactive: true,
    });
    return assortment;
  },
};
