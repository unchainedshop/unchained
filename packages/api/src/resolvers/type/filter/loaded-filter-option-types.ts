import { FilterDirector } from '@unchainedshop/core';
import { Context } from '../../../context.js';

export const LoadedFilterOption = {
  filteredProductsCount: async ({ filteredProductIdSet, searchQuery }, _: never, context: Context) => {
    if (!filteredProductIdSet?.size) {
      return 0;
    }
    const filterActions = await FilterDirector.actions({ searchQuery }, context);
    return filterActions.aggregateProductIds({
      productIds: Array.from(filteredProductIdSet),
    }).length;
  },

  definition: ({ filter, value }) => {
    return { filterOption: value, ...filter };
  },
};
