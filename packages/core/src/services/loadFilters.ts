import { SearchQuery, defaultFilterSelector } from '@unchainedshop/core-filters';
import { Modules } from '../modules.js';
import { FilterDirector } from '../directors/FilterDirector.js';

export const loadFiltersService = async (
  searchQuery: SearchQuery,
  { productIds, forceLiveCollection }: { productIds: Array<string>; forceLiveCollection: boolean },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;

  const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);
  const filterSelector = await filterActions.transformFilterSelector(defaultFilterSelector(searchQuery));

  if (!filterSelector) return [];

  const otherFilters = await modules.filters.findFilters({
    ...filterSelector,
    limit: 0,
    includeInactive: true,
  });

  const extractedFilterIds = (filterSelector?._id as any)?.$in || [];
  const sortedFilters = otherFilters.sort((left, right) => {
    const leftIndex = extractedFilterIds.indexOf(left._id);
    const rightIndex = extractedFilterIds.indexOf(right._id);
    return leftIndex - rightIndex;
  });

  return Promise.all(
    sortedFilters.map(async (filter) => {
      const { examinedProductIdSet, filteredByOtherFiltersSet, filteredByThisFilterSet } =
        await FilterDirector.filterFacets(
          filter,
          {
            searchQuery,
            forceLiveCollection,
            allProductIds: productIds,
            otherFilters,
          },
          unchainedAPI,
        );

      return {
        forceLiveCollection,
        searchQuery,
        filter,
        examinedProductIdSet,
        filteredByOtherFiltersSet,
        filteredByThisFilterSet,
      };
    }),
  );
};
