import { UnchainedCore } from '@unchainedshop/core';
import { Filter } from '@unchainedshop/core-filters';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ filterId: string }, Filter>(async (queries) => {
    const filterIds = [...new Set(queries.map((q) => q.filterId).filter(Boolean))];

    const filters = await unchainedAPI.modules.filters.findFilters({
      filterIds,
      includeInactive: true,
    });

    const filterMap = {};
    for (const filter of filters) {
      filterMap[filter._id] = filter;
    }

    return queries.map((q) => filterMap[q.filterId]);
  });
