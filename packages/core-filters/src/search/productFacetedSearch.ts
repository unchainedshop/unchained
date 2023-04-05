import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Filter } from '@unchainedshop/types/filters.js';
import { mongodb } from '@unchainedshop/mongodb';
import { intersectSet } from '../utils/intersectSet.js';
import { FilterProductIds, SearchConfiguration } from './search.js';

export const productFacetedSearch = (
  Filters: mongodb.Collection<Filter>,
  filterProductIds: FilterProductIds,
  searchConfiguration: SearchConfiguration,
  unchainedAPI: UnchainedCore,
) => {
  const { query, filterSelector, forceLiveCollection } = searchConfiguration;

  return async (productIds: Array<string>) => {
    if (!query || query.length === 0) return productIds;

    const filters = filterSelector ? await Filters.find(filterSelector).toArray() : [];

    const intersectedProductIds = await filters.reduce(
      async (productIdSetPromise: Promise<Set<string>>, filter) => {
        const productIdSet = await productIdSetPromise;

        if (!query.filterQuery[filter.key]) return productIdSet;

        const filterOptionProductIds = await filterProductIds(
          filter,
          {
            values: query.filterQuery[filter.key],
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
