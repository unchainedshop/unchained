import { Context } from '@unchainedshop/types/api';
import { Assortment, AssortmentFilter as AssortmentFilterType } from '@unchainedshop/types/assortments';
import { Filter } from '@unchainedshop/types/filters';

type HelperType<T> = (assortmentFilter: AssortmentFilterType, _: never, context: Context) => T;

export type AssortmentFilterHelperTypes = {
  assortment: HelperType<Promise<Assortment>>;
  filter: HelperType<Promise<Filter>>;
};

export const AssortmentFilter: AssortmentFilterHelperTypes = {
  assortment: async (obj, _, { loaders }) => {
    const assortment = await loaders.assortmentLoader.load({
      assortmentId: obj.assortmentId,
      includeInactive: true,
    });
    return assortment;
  },

  filter: async (obj, _, { loaders }) => {
    const filter = await loaders.filterLoader.load({
      filterId: obj.filterId,
    });
    return filter;
  },
};
