import { Context } from '@unchainedshop/types/api';
import { Assortment, AssortmentLink as AssortmentLinkType } from '@unchainedshop/types/assortments';

type HelperType<T> = (assortmentLink: AssortmentLinkType, _: never, context: Context) => T;

export type AssortmentLinkHelperTypes = {
  child: HelperType<Promise<Assortment>>;
  parent: HelperType<Promise<Assortment>>;
};

export const AssortmentLink: AssortmentLinkHelperTypes = {
  child: (obj, _, { modules }) =>
    modules.assortments.findAssortment({
      assortmentId: obj.childAssortmentId,
    }),

  parent: (obj, _, { modules }) =>
    modules.assortments.findAssortment({
      assortmentId: obj.parentAssortmentId,
    }),
};
