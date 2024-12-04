import { Assortment, AssortmentsModule } from '@unchainedshop/core-assortments';
import {
  assortmentFulltextSearch,
  FilterDirector,
  FiltersModule,
  resolveAssortmentSelector,
  resolveFilterSelector,
  resolveSortStage,
  SearchConfiguration,
  SearchQuery,
} from '@unchainedshop/core-filters';
import { mongodb } from '@unchainedshop/mongodb';

export interface SearchAssortmentConfiguration extends SearchConfiguration {
  assortmentSelector: mongodb.Filter<Assortment>;
}

export const searchAssortmentsService = async (
  searchQuery: SearchQuery,
  { forceLiveCollection }: { forceLiveCollection?: boolean },
  unchainedAPI: {
    modules: {
      filters: FiltersModule;
      assortments: AssortmentsModule;
    };
  },
) => {
  const { modules } = unchainedAPI;
  const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);

  const query = modules.filters.cleanQuery(searchQuery);
  const filterSelector = await resolveFilterSelector(searchQuery, filterActions);
  const assortmentSelector = resolveAssortmentSelector(searchQuery);
  const sortStage = await resolveSortStage(searchQuery, filterActions);

  const searchConfiguration: SearchAssortmentConfiguration = {
    query,
    filterSelector,
    assortmentSelector,
    sortStage,
    forceLiveCollection,
  };

  const assortmentIds = await query.assortmentIds;
  const totalAssortmentIds = await assortmentFulltextSearch<Assortment>(
    searchConfiguration,
    filterActions,
  )(assortmentIds);

  const assortmentsCount = async () =>
    modules.assortments.count({
      assortmentSelector,
      assortmentIds: totalAssortmentIds,
    });

  return {
    assortmentsCount,
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
