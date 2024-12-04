import { intersectSet } from '../utils/intersectSet.js';
import { FilterProductIds, SearchConfiguration } from './search.js';

export const productFacetedSearch = (
  filterProductIds: FilterProductIds,
  searchConfiguration: SearchConfiguration,
  unchainedAPI,
) => {
  const { query, filterSelector, forceLiveCollection } = searchConfiguration;
  const { modules } = unchainedAPI;

  return async (productIds: Array<string>) => {
    if (!query || !query.filterQuery) return productIds;

    const filters = filterSelector
      ? await modules.filters.findFilters({
          ...filterSelector,
          limit: 0,
          includeInactive: true,
        })
      : [];

    const intersectedProductIds = await filters.reduce(
      async (productIdSetPromise: Promise<Set<string>>, filter) => {
        const productIdSet = await productIdSetPromise;

        if (!query.filterQuery[filter.key]) return productIdSet;

        const values = query.filterQuery[filter.key];

        const filterOptionProductIds = await filterProductIds(
          filter,
          {
            values,
            forceLiveCollection,
          },
          unchainedAPI,
        );

        return intersectSet(productIdSet, new Set(filterOptionProductIds));
      },
      Promise.resolve(new Set(productIds)),
    );

    return [...intersectedProductIds];
  };
};
