import { type SearchQuery, defaultFilterSelector } from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import { FilterDirector } from '../directors/FilterDirector.ts';

export async function loadFiltersService(
  this: Modules,
  searchQuery: SearchQuery,
  options: {
    productIds: string[];
    forceLiveCollection?: boolean;
    locale?: Intl.Locale;
    userId?: string;
  },
) {
  const filterActions = await FilterDirector.actions({ searchQuery }, { modules: this });
  const filterSelector = await filterActions.transformFilterSelector(
    defaultFilterSelector(searchQuery),
    options,
  );

  if (!filterSelector) return [];

  const otherFilters = await this.filters.findFilters({
    ...filterSelector,
    limit: 0,
    includeInactive: true,
  });

  const extractedFilterIds = (filterSelector?._id as any)?.$in || [];
  const sortedFilters = otherFilters.toSorted((left, right) => {
    const leftIndex = extractedFilterIds.indexOf(left._id);
    const rightIndex = extractedFilterIds.indexOf(right._id);
    return leftIndex - rightIndex;
  });

  const allProductIdSet = new Set(options.productIds || []);

  return Promise.all(
    sortedFilters.map(async (filter) => {
      const { examinedProductIdSet, filteredByOtherFiltersSet, filteredByThisFilterSet } =
        await FilterDirector.filterFacets(
          filter,
          {
            searchQuery,
            forceLiveCollection: !!options.forceLiveCollection,
            allProductIdSet,
            otherFilters: sortedFilters,
          },
          { modules: this },
        );

      return {
        forceLiveCollection: !!options.forceLiveCollection,
        searchQuery,
        filter,
        examinedProductIdSet,
        filteredByOtherFiltersSet,
        filteredByThisFilterSet,
      };
    }),
  );
}
