import {
  loadFilter,
  productFacetedSearch,
  resolveFilterSelector,
  resolveProductSelector,
  resolveSortStage,
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
  const { modules } = unchainedAPI;
  const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);

  const query = modules.filters.cleanQuery(searchQuery);
  const filterSelector = await resolveFilterSelector(searchQuery, filterActions);
  const productSelector = await resolveProductSelector(searchQuery, filterActions, unchainedAPI);
  const sortStage = await resolveSortStage(searchQuery, filterActions);

  const searchConfiguration: SearchProductConfiguration = {
    query,
    filterSelector,
    productSelector,
    sortStage,
    forceLiveCollection,
  };

  const productIds = await query.productIds;
  const totalProductIds =
    (await filterActions.searchProducts({ productIds }, searchConfiguration)) || [];

  const findFilters = async () => {
    if (!filterSelector) return [];

    const extractedFilterIds = (filterSelector?._id as any)?.$in || [];

    const otherFilters = await modules.filters.findFilters({
      ...filterSelector,
      limit: 0,
      includeInactive: true,
    });

    const sortedFilters = otherFilters.sort((left, right) => {
      const leftIndex = extractedFilterIds.indexOf(left._id);
      const rightIndex = extractedFilterIds.indexOf(right._id);
      return leftIndex - rightIndex;
    });

    const relevantProductIds = await modules.products.findProductIds({
      productSelector,
      productIds: totalProductIds,
      includeDrafts: searchQuery.includeInactive,
    });

    return Promise.all(
      sortedFilters.map(async (filter) => {
        return loadFilter(
          filter,
          {
            allProductIds: relevantProductIds,
            filterQuery: query.filterQuery,
            forceLiveCollection,
            otherFilters,
          },
          FilterDirector.filterProductIds,
          filterActions,
          unchainedAPI,
        );
      }),
    );
  };

  if (searchQuery.productIds?.length === 0) {
    // Restricted to an empty array of products
    // will always lead to an empty result
    return {
      productsCount: async () => 0,
      filteredProductsCount: async () => 0,
      products: async () => [] as Array<Product>,
      filters: findFilters,
    };
  }

  const filteredProductIds = await productFacetedSearch(
    FilterDirector.filterProductIds,
    searchConfiguration,
    unchainedAPI,
  )(totalProductIds);

  const aggregatedTotalProductIds = filterActions.aggregateProductIds({
    productIds: totalProductIds,
  });

  const aggregatedFilteredProductIds = filterActions.aggregateProductIds({
    productIds: filteredProductIds,
  });

  return {
    productsCount: async () =>
      modules.products.search.countFilteredProducts({
        productSelector,
        productIds: aggregatedTotalProductIds,
      }),
    filteredProductsCount: async () =>
      modules.products.search.countFilteredProducts({
        productSelector,
        productIds: aggregatedFilteredProductIds,
      }),
    products: async ({ offset, limit }) =>
      modules.products.search.findFilteredProducts({
        limit,
        offset,
        productIds: aggregatedFilteredProductIds,
        productSelector,
        sort: sortStage,
      }),
    filters: findFilters,
  };
};
