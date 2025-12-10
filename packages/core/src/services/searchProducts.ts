import {
  defaultFilterSelector,
  defaultProductSelector,
  defaultSortStage,
  type SearchQuery,
} from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import { FilterDirector, type SearchProductsOptions } from '../directors/index.ts';

export async function searchProductsService(
  this: Modules,
  searchQuery: SearchQuery,
  options: { forceLiveCollection?: boolean; locale: Intl.Locale; userId?: string },
) {
  const filterActions = await FilterDirector.actions({ searchQuery }, { modules: this });

  const filterSelector = await filterActions.transformFilterSelector(
    defaultFilterSelector(searchQuery),
    options,
  );
  const productSelector = await filterActions.transformProductSelector(
    defaultProductSelector(searchQuery, { modules: this }),
    options,
  );
  const sortStage = await filterActions.transformSortStage(defaultSortStage(searchQuery), options);

  const searchConfiguration: SearchProductsOptions = {
    searchQuery,
    filterSelector,
    productSelector,
    sortStage,
    ...options,
    forceLiveCollection: !!options.forceLiveCollection,
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

  const totalProductIds =
    (await filterActions.searchProducts(searchQuery, searchConfiguration)) ||
    (await this.products.findProductIds({ includeDrafts: searchQuery.includeInactive }));

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
