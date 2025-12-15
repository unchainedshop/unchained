import {
  defaultAssortmentSelector,
  defaultFilterSelector,
  defaultSortStage,
  type SearchQuery,
} from '@unchainedshop/core-filters';
import { SortDirection } from '@unchainedshop/utils';
import type { Modules } from '../modules.ts';
import { FilterDirector, type SearchAssortmentsOptions } from '../directors/index.ts';

// Convert MongoDB sort format to SortOption[] format
const convertSortStage = (
  sortStage: Record<string, 1 | -1> | undefined,
): { key: string; value: SortDirection }[] | undefined => {
  if (!sortStage) return undefined;
  return Object.entries(sortStage).map(([key, value]) => ({
    key,
    value: value === -1 ? SortDirection.DESC : SortDirection.ASC,
  }));
};

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
        sort: convertSortStage(sortStage as Record<string, 1 | -1>),
      }),
  };
}
