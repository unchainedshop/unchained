import { Product } from '@unchainedshop/types/products.js';
import { mongodb } from '@unchainedshop/mongodb';
import { FilterDirector } from '../director/FilterDirector.js';
import { assortmentFulltextSearch } from '../search/assortmentFulltextSearch.js';
import { cleanQuery } from '../search/cleanQuery.js';
import { loadFilter } from '../search/loadFilter.js';
import { productFacetedSearch } from '../search/productFacetedSearch.js';
import { productFulltextSearch } from '../search/productFulltextSearch.js';
import { resolveAssortmentSelector } from '../search/resolveAssortmentSelector.js';
import { resolveFilterSelector } from '../search/resolveFilterSelector.js';
import { resolveProductSelector } from '../search/resolveProductSelector.js';
import { resolveSortStage } from '../search/resolveSortStage.js';
import {
  FilterProductIds,
  SearchAssortmentConfiguration,
  SearchProductConfiguration,
} from '../search/search.js';
import { SearchQuery, Filter } from '../types.js';
import { UnchainedCore } from '@unchainedshop/core';
import { Assortment } from '@unchainedshop/core-assortments';

export type SearchProducts = {
  productsCount: () => Promise<number>;
  filteredProductsCount: () => Promise<number>;
  products: (params: { limit: number; offset: number }) => Promise<Array<Product>>;
};

export type SearchAssortments = {
  assortmentsCount: () => Promise<number>;
  assortments: (params: { limit: number; offset: number }) => Promise<Array<Assortment>>;
};

export type FilterSearchModule = {
  searchProducts: (
    searchQuery: SearchQuery,
    params: { forceLiveCollection?: boolean },
    unchainedAPI: UnchainedCore,
  ) => Promise<SearchProducts>;

  searchAssortments: (
    searchQuery: SearchQuery,
    params: { forceLiveCollection?: boolean },
    unchainedAPI: UnchainedCore,
  ) => Promise<SearchAssortments>;
};

export const configureFilterSearchModule = ({
  Filters,
  filterProductIds,
}: {
  Filters: mongodb.Collection<Filter>;
  filterProductIds: FilterProductIds;
}): FilterSearchModule => {
  return {
    searchAssortments: async (searchQuery, { forceLiveCollection }, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);

      const query = cleanQuery(searchQuery);
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
      const totalAssortmentIds = await assortmentFulltextSearch(
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
    },

    searchProducts: async (searchQuery, { forceLiveCollection }, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);

      const query = cleanQuery(searchQuery);
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
      const totalProductIds = await productFulltextSearch(
        searchConfiguration,
        filterActions,
      )(productIds);

      const findFilters = async () => {
        if (!filterSelector) return [];

        const extractedFilterIds = (filterSelector?._id as any)?.$in || [];
        const otherFilters = await Filters.find(filterSelector).toArray();
        const sortedFilters = otherFilters.sort((left, right) => {
          const leftIndex = extractedFilterIds.indexOf(left._id);
          const rightIndex = extractedFilterIds.indexOf(right._id);
          return leftIndex - rightIndex;
        });

        const relevantProducts = await modules.products.findProducts(
          {
            productSelector,
            productIds: totalProductIds,
            includeDrafts: searchQuery.includeInactive,
          },
          {
            projection: { _id: 1 },
          },
        );
        const relevantProductIds = relevantProducts.map(({ _id }) => _id);
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
              filterProductIds,
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
        Filters,
        filterProductIds,
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
    },
  };
};
