import { defaultFilterSelector, defaultSortStage, type SearchQuery } from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import {
  FilterDirector,
  SearchDirector,
  SearchEntityType,
  type FilterProductsOptions,
  type ProductFilterQueryItem,
} from '../directors/index.ts';

export async function searchProductsService(
  this: Modules,
  searchQuery: SearchQuery,
  options: { forceLiveCollection?: boolean; locale: Intl.Locale; userId?: string },
) {
  // Resolve assortmentId to productIds and filterIds if provided
  let resolvedSearchQuery = searchQuery;
  if (searchQuery.assortmentId) {
    const assortment = await this.assortments.findAssortment({
      assortmentId: searchQuery.assortmentId,
    });
    if (assortment) {
      const assortmentProductIds = await this.assortments.findProductIds({
        assortment,
        ignoreChildAssortments: searchQuery.ignoreChildAssortments,
      });
      const assortmentFilterIds = await this.assortments.filters.findFilterIds({
        assortmentId: searchQuery.assortmentId,
      });
      resolvedSearchQuery = {
        ...searchQuery,
        productIds: searchQuery.productIds
          ? searchQuery.productIds.filter((id) => assortmentProductIds.includes(id))
          : assortmentProductIds,
        filterIds: searchQuery.filterIds
          ? [...new Set([...searchQuery.filterIds, ...assortmentFilterIds])]
          : assortmentFilterIds,
      };
    }
  }

  const filterActions = await FilterDirector.actions(
    { searchQuery: resolvedSearchQuery },
    { modules: this },
  );

  const filterSelector = await filterActions.transformFilterSelector(
    defaultFilterSelector(resolvedSearchQuery),
    options,
  );

  // Build product filter query from adapters
  const baseFilterQuery: ProductFilterQueryItem[] = [];
  const productFilterQuery = await filterActions.transformProductFilterQuery(baseFilterQuery, options);

  // Get sort stage from search query
  const sortStage = defaultSortStage(resolvedSearchQuery);

  const searchConfiguration: FilterProductsOptions = {
    searchQuery: resolvedSearchQuery,
    filterSelector,
    productFilterQuery,
    sortStage,
    ...options,
    forceLiveCollection: !!options.forceLiveCollection,
  };

  if (resolvedSearchQuery.productIds?.length === 0) {
    return {
      searchConfiguration,
      aggregatedTotalProductIds: [],
      aggregatedFilteredProductIds: [],
      totalProductIds: [],
    };
  }

  // Use SearchDirector for full-text search, module handles intersection with productIds
  let totalProductIds: string[];
  if (resolvedSearchQuery.queryString) {
    const searchActions = SearchDirector.actions(
      { queryString: resolvedSearchQuery.queryString, locale: options.locale, userId: options.userId },
      { modules: this },
    );
    const searchProductIds = await searchActions.search(SearchEntityType.PRODUCT);
    if (searchProductIds.length === 0) {
      totalProductIds = [];
    } else {
      totalProductIds = await this.products.findProductIds({
        includeDrafts: resolvedSearchQuery.includeInactive,
        productIds: resolvedSearchQuery.productIds,
        searchProductIds,
      });
    }
  } else {
    totalProductIds = await this.products.findProductIds({
      includeDrafts: resolvedSearchQuery.includeInactive,
      productIds: resolvedSearchQuery.productIds,
    });
  }

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
