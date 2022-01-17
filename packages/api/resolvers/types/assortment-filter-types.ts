import { Context } from '@unchainedshop/types/api';
import {
  Assortment,
  AssortmentFilter as AssortmentFilterType,
} from '@unchainedshop/types/assortments';
import { Filter } from '@unchainedshop/types/filters';

type HelperType<T> = (
  assortmentFilter: AssortmentFilterType,
  _: never,
  context: Context
) => T;

type AssortmentFilterHelperTypes = {
  assortment: HelperType<Promise<Assortment>>;
  filter: HelperType<Promise<Filter>>;
};

export const AssortmentFilter: AssortmentFilterHelperTypes = {
  assortment: async (obj, _, { modules }) => {
    const assortment = await modules.assortments.findAssortment({
      assortmentId: obj.assortmentId,
    });

    console.log('ASSORTMENT-TYPE', assortment, obj)
    return assortment
  },

  filter: async (obj, _, { modules }) => {
    return await modules.filters.findFilter({
      filterId: obj.filterId,
    });
  },
};
