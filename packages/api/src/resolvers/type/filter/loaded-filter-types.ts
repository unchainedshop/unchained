import { Context } from '../../../context.js';
import { Filter, SearchQuery } from '@unchainedshop/core-filters';
import { FilterDirector } from '@unchainedshop/core';

export interface LoadedFilterData {
  forceLiveCollection: boolean;
  searchQuery: SearchQuery;
  filter: Filter;
  examinedProductIdSet: Set<string>;
  filteredByOtherFiltersSet: Set<string>;
  filteredByThisFilterSet: Set<string>;
}

export const LoadedFilter = {
  definition: ({ filter }: LoadedFilterData) => {
    return filter;
  },
  isSelected: ({ searchQuery, filter }: LoadedFilterData) => {
    return searchQuery?.filterQuery?.some((q) => q.key === filter.key);
  },
  filteredProductsCount: async (
    { filteredByOtherFiltersSet, filteredByThisFilterSet, searchQuery }: LoadedFilterData,
    _: never,
    context: Context,
  ) => {
    const filterActions = await FilterDirector.actions({ searchQuery }, context);
    return filterActions.aggregateProductIds({
      productIds: Array.from(filteredByOtherFiltersSet.intersection(filteredByThisFilterSet)),
    }).length;
  },
  productsCount: async (
    { examinedProductIdSet, searchQuery }: LoadedFilterData,
    _: never,
    context: Context,
  ) => {
    const filterActions = await FilterDirector.actions({ searchQuery }, context);
    return filterActions.aggregateProductIds({
      productIds: Array.from(examinedProductIdSet),
    }).length;
  },
  options: async (
    { filter, filteredByOtherFiltersSet, forceLiveCollection, searchQuery }: LoadedFilterData,
    _: never,
    context: Context,
  ) => {
    const { services } = context;
    // The current base for options should be an array of product id's that:
    // - Are part of the preselected product id array
    // - Fit this filter generally
    // - Are filtered by all other filters
    // - Are not filtered by the currently selected value of this filter
    return services.filters.loadFilterOptions(filter, {
      searchQuery,
      forceLiveCollection,
      productIdSet: filteredByOtherFiltersSet,
    });
  },
};
