import { Assortment } from '@unchainedshop/core-assortments';
import {
  defaultAssortmentSelector,
  defaultFilterSelector,
  defaultSortStage,
  SearchConfiguration,
  SearchQuery,
} from '@unchainedshop/core-filters';
import { mongodb } from '@unchainedshop/mongodb';
import { Modules } from '../modules.js';
import { FilterDirector } from '../directors/index.js';
export interface SearchAssortmentConfiguration extends SearchConfiguration {
  assortmentSelector: mongodb.Filter<Assortment>;
}

export async function searchAssortmentsService(
  this: Modules,
  searchQuery: SearchQuery,
  { forceLiveCollection, locale }: { forceLiveCollection?: boolean; locale: Intl.Locale },
) {
  const filterActions = await FilterDirector.actions({ searchQuery }, { modules: this });

  const filterSelector = await filterActions.transformFilterSelector(defaultFilterSelector(searchQuery));
  const assortmentSelector = defaultAssortmentSelector(searchQuery);
  const sortStage = await filterActions.transformSortStage(defaultSortStage(searchQuery));

  const searchConfiguration: SearchAssortmentConfiguration = {
    searchQuery,
    filterSelector,
    assortmentSelector,
    sortStage,
    forceLiveCollection: !!forceLiveCollection,
    locale,
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
