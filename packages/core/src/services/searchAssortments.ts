import {
  defaultAssortmentSelector,
  defaultFilterSelector,
  defaultSortStage,
  type SearchQuery,
} from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import {
  FilterDirector,
  SearchDirector,
  SearchEntityType,
  type FilterAssortmentsOptions,
} from '../directors/index.ts';

export async function searchAssortmentsService(
  this: Modules,
  searchQuery: SearchQuery,
  options: { forceLiveCollection?: boolean; locale: Intl.Locale; userId?: string },
) {
  const filterActions = await FilterDirector.actions({ searchQuery }, { modules: this });

  const filterSelector = await filterActions.transformFilterSelector(
    defaultFilterSelector(searchQuery),
    options,
  );
  const assortmentSelector = defaultAssortmentSelector(searchQuery);
  const sortStage = await filterActions.transformSortStage(defaultSortStage(searchQuery), options);

  const searchConfiguration: FilterAssortmentsOptions = {
    searchQuery,
    filterSelector,
    assortmentSelector,
    sortStage,
    ...options,
    forceLiveCollection: !!options.forceLiveCollection,
  };

  // Use SearchDirector for full-text search, module handles intersection with assortmentIds
  let totalAssortmentIds: string[];
  if (searchQuery.queryString) {
    const searchActions = SearchDirector.actions(
      { queryString: searchQuery.queryString, locale: options.locale, userId: options.userId },
      { modules: this },
    );
    const searchAssortmentIds = await searchActions.search(SearchEntityType.ASSORTMENT);
    if (searchAssortmentIds.length === 0) {
      totalAssortmentIds = [];
    } else {
      totalAssortmentIds = await this.assortments.findAssortmentIds({
        includeInactive: searchQuery.includeInactive,
        assortmentIds: searchQuery.assortmentIds,
        searchAssortmentIds,
      });
    }
  } else {
    totalAssortmentIds = await this.assortments.findAssortmentIds({
      includeInactive: searchQuery.includeInactive,
      assortmentIds: searchQuery.assortmentIds,
    });
  }

  return {
    searchConfiguration,
    totalAssortmentIds,

    assortmentsCount: async () =>
      this.assortments.count({
        assortmentIds: totalAssortmentIds,
        includeInactive: searchQuery.includeInactive,
      }),
    assortments: async ({ offset, limit }) =>
      this.assortments.search.findFilteredAssortments({
        limit,
        offset,
        assortmentIds: totalAssortmentIds,
        sort: sortStage,
        includeInactive: searchQuery.includeInactive,
      }),
  };
}
