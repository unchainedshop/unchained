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

export const searchAssortmentsService = async (
  searchQuery: SearchQuery,
  { forceLiveCollection }: { forceLiveCollection?: boolean },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);

  const filterSelector = await filterActions.transformFilterSelector(defaultFilterSelector(searchQuery));
  const assortmentSelector = defaultAssortmentSelector(searchQuery);
  const sortStage = await filterActions.transformSortStage(defaultSortStage(searchQuery));

  const searchConfiguration: SearchAssortmentConfiguration = {
    searchQuery,
    filterSelector,
    assortmentSelector,
    sortStage,
    forceLiveCollection,
  };

  const assortmentIds = await searchQuery.assortmentIds;

  const totalAssortmentIds =
    (await filterActions.searchAssortments({ assortmentIds }, searchConfiguration)) || [];

  return {
    searchConfiguration,
    totalAssortmentIds,

    assortmentsCount: async () =>
      modules.assortments.count({
        assortmentSelector,
        assortmentIds: totalAssortmentIds,
      }),
    assortments: async ({ offset, limit }) =>
      modules.assortments.search.findFilteredAssortments({
        limit,
        offset,
        assortmentIds: totalAssortmentIds,
        assortmentSelector,
        sort: sortStage,
      }),
  };
};
