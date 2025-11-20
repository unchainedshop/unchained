import {
  defaultAssortmentSelector,
  defaultFilterSelector,
  defaultSortStage,
  SearchQuery,
} from '@unchainedshop/core-filters';
import { Modules } from '../modules.js';
import { FilterDirector, SearchAssortmentsOptions } from '../directors/index.js';

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

  const searchConfiguration: SearchAssortmentsOptions = {
    searchQuery,
    filterSelector,
    assortmentSelector,
    sortStage,
    ...options,
    forceLiveCollection: !!options.forceLiveCollection,
  };

  const assortmentIds = await searchQuery.assortmentIds;

  const totalAssortmentIds =
    (await filterActions.searchAssortments({ assortmentIds }, searchConfiguration)) ||
    (await this.assortments.findAssortmentIds({ includeInactive: searchQuery.includeInactive }));

  return {
    searchConfiguration,
    totalAssortmentIds,

    assortmentsCount: async () =>
      this.assortments.count({
        assortmentSelector,
        assortmentIds: totalAssortmentIds,
      }),
    assortments: async ({ offset, limit }) =>
      this.assortments.search.findFilteredAssortments({
        limit,
        offset,
        assortmentIds: totalAssortmentIds,
        assortmentSelector,
        sort: sortStage,
      }),
  };
}
