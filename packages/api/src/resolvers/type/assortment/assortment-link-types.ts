import type { Context } from '../../../context.ts';
import type { Assortment, AssortmentLink as AssortmentLinkType } from '@unchainedshop/core-assortments';

type HelperType<T> = (assortmentLink: AssortmentLinkType, _: never, context: Context) => T;

export interface AssortmentLinkHelperTypes {
  child: HelperType<Promise<Assortment>>;
  parent: HelperType<Promise<Assortment>>;
}

export const AssortmentLink: AssortmentLinkHelperTypes = {
  child: async (obj, _, { loaders }) => {
    const assortment = await loaders.assortmentLoader.load({
      assortmentId: obj.childAssortmentId,
    });
    return assortment;
  },

  parent: async (obj, _, { loaders }) => {
    const assortment = await loaders.assortmentLoader.load({
      assortmentId: obj.parentAssortmentId,
    });
    return assortment;
  },
};
