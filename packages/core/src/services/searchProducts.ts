import {
  defaultFilterSelector,
  defaultProductSelector,
  defaultSortStage,
  SearchConfiguration,
  SearchQuery,
} from '@unchainedshop/core-filters';
import { Product } from '@unchainedshop/core-products';
import { mongodb } from '@unchainedshop/mongodb';
import { Modules } from '../modules.js';
import { FilterDirector } from '../directors/index.js';
export interface SearchProductConfiguration extends SearchConfiguration {
  productSelector: mongodb.Filter<Product>;
}

export const searchProductsService = async (
  searchQuery: SearchQuery,
  { forceLiveCollection }: { forceLiveCollection?: boolean },
  unchainedAPI: { modules: Modules },
) => {
  const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);

  const filterSelector = await filterActions.transformFilterSelector(defaultFilterSelector(searchQuery));
  const productSelector = await filterActions.transformProductSelector(
    defaultProductSelector(searchQuery, unchainedAPI),
    {},
  );
  const sortStage = await filterActions.transformSortStage(defaultSortStage(searchQuery));

  const searchConfiguration: SearchProductConfiguration = {
    searchQuery,
    filterSelector,
    productSelector,
    sortStage,
    forceLiveCollection,
  };

  if (searchQuery.productIds?.length === 0) {
    // Restricted to an empty array of products
    // will always lead to an empty result
    return {
      searchConfiguration,
      aggregatedTotalProductIds: [],
      aggregatedFilteredProductIds: [],
      totalProductIds: [],
    };
  }

  const productIds = await searchQuery.productIds;
  const totalProductIds =
    (await filterActions.searchProducts({ productIds }, searchConfiguration)) || [];

  const filteredProductIds = await FilterDirector.productFacetedSearch(
    totalProductIds,
    searchConfiguration,
    unchainedAPI,
  );

  const aggregatedTotalProductIds = filterActions.aggregateProductIds({
    productIds: totalProductIds,
  });

  const aggregatedFilteredProductIds = filterActions.aggregateProductIds({
    productIds: filteredProductIds,
  });

  return {
    searchConfiguration,
    totalProductIds,
    aggregatedTotalProductIds,
    aggregatedFilteredProductIds,
  };
};
