import { Context } from '@unchainedshop/types/api';
import {
  Assortment,
  AssortmentLink as AssortmentLinkType,
} from '@unchainedshop/types/assortments';
import { Product } from '@unchainedshop/types/products';

type HelperType<T> = (
  assortmentLink: AssortmentLinkType,
  _: never,
  context: Context
) => T;

type AssortmentLinkHelperTypes = {
  child: HelperType<Promise<Assortment>>;
  parent: HelperType<Promise<Assortment>>;
};

export const AssortmentLink: AssortmentLinkHelperTypes = {
  child: async (obj, _, { modules }) => {
    return await modules.assortments.findAssortment({
      assortmentId: obj.childAssortmentId,
    });
  },
  parent: async (obj, _, { modules }) => {
    return await modules.assortments.findAssortment({
      assortmentId: obj.parentAssortmentId,
    });
  },
};
