import { SearchQuery, defaultFilterSelector } from '@unchainedshop/core-filters';
import { Modules } from '../modules.js';
import { FilterDirector } from '../directors/FilterDirector.js';

export async function loadFiltersService(
  this: Modules,
  searchQuery: SearchQuery,
  { productIds, forceLiveCollection }: { productIds: Array<string>; forceLiveCollection: boolean },
) {
  const filterActions = await FilterDirector.actions({ searchQuery }, { modules: this });
  const filterSelector = await filterActions.transformFilterSelector(defaultFilterSelector(searchQuery));

  if (!filterSelector) return [];

  const otherFilters = await this.filters.findFilters({
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
          { modules: this },
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
}
