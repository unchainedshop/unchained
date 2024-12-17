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

export async function searchProductsService(
  this: Modules,
  searchQuery: SearchQuery,
  { forceLiveCollection }: { forceLiveCollection?: boolean },
) {
  const filterActions = await FilterDirector.actions({ searchQuery }, { modules: this });

  const filterSelector = await filterActions.transformFilterSelector(defaultFilterSelector(searchQuery));
  const productSelector = await filterActions.transformProductSelector(
    defaultProductSelector(searchQuery, { modules: this }),
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
    { modules: this },
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
}
