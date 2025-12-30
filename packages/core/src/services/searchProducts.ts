import { defaultFilterSelector, defaultSortStage, type SearchQuery } from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import {
  FilterDirector,
  type SearchProductsOptions,
  type ProductFilterQueryItem,
} from '../directors/index.ts';

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

  // Build product filter query from adapters
  const baseFilterQuery: ProductFilterQueryItem[] = [];
  const productFilterQuery = await filterActions.transformProductFilterQuery(baseFilterQuery, options);

  // Get sort stage from search query
  const sortStage = defaultSortStage(searchQuery);

  const searchConfiguration: SearchProductsOptions = {
    searchQuery,
    filterSelector,
    productFilterQuery,
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
