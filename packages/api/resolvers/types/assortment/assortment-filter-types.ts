import { Context } from '@unchainedshop/types/api';
import { Assortment, AssortmentFilter as AssortmentFilterType } from '@unchainedshop/types/assortments';
import { Filter } from '@unchainedshop/types/filters';

type HelperType<T> = (assortmentFilter: AssortmentFilterType, _: never, context: Context) => T;

type AssortmentFilterHelperTypes = {
  assortment: HelperType<Promise<Assortment>>;
  filter: HelperType<Promise<Filter>>;
};

export const AssortmentFilter: AssortmentFilterHelperTypes = {
  assortment: (obj, _, { modules }) =>
    modules.assortments.findAssortment({
      assortmentId: obj.assortmentId,
    }),

  filter: (obj, _, { modules }) =>
    modules.filters.findFilter({
      filterId: obj.filterId,
    }),
};
