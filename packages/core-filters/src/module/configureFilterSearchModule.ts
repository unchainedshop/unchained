import { Filter, FiltersModule } from '@unchainedshop/types/filters.js';
import { Product } from '@unchainedshop/types/products.js';
import { mongodb } from '@unchainedshop/mongodb';
import { UnchainedCore } from '@unchainedshop/types/core.js';
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

const findFilters =
  (
    {
      filterSelector,
      productSelector,
      query,
      forceLiveCollection,
      filterActions,
      filterProductIds,
      productIds,
    }: SearchProductConfiguration & { filterProductIds: FilterProductIds; productIds?: string[] },
    unchainedAPI: UnchainedCore,
  ) =>
  async () => {
    if (!filterSelector) return [];

    const extractedFilterIds = (filterSelector?._id as any)?.$in || [];
    const otherFilters = await unchainedAPI.modules.filters.findFilters(filterSelector);
    const sortedFilters = otherFilters.sort((left, right) => {
      const leftIndex = extractedFilterIds.indexOf(left._id);
      const rightIndex = extractedFilterIds.indexOf(right._id);
      return leftIndex - rightIndex;
    });

    const relevantProducts = await unchainedAPI.modules.products.findProducts(
      {
        productSelector,
        productIds,
        includeDrafts: query.includeInactive,
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

export const configureFilterSearchModule = ({
  Filters,
  filterProductIds,
}: {
  Filters: mongodb.Collection<Filter>;
  filterProductIds: FilterProductIds;
}): FiltersModule['search'] => {
  return {
    searchAssortments: async (searchQuery, { forceLiveCollection }, unchainedAPI) => {
      const { modules } = unchainedAPI;

      const query = cleanQuery(searchQuery);
      const filterActions = await FilterDirector.actions({ searchQuery: query }, unchainedAPI);
      const filterSelector = await resolveFilterSelector(query, filterActions);
      const assortmentSelector = resolveAssortmentSelector(query);
      const sortStage = await resolveSortStage(query, filterActions);

      const searchConfiguration: SearchAssortmentConfiguration = {
        query,
        filterSelector,
        assortmentSelector,
        sortStage,
        forceLiveCollection,
        filterActions,
      };

      const assortmentIds = await query.assortmentIds;
      const totalAssortmentIds = await assortmentFulltextSearch(searchConfiguration)(assortmentIds);

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

      const query = cleanQuery(searchQuery);
      const filterActions = await FilterDirector.actions({ searchQuery: query }, unchainedAPI);
      const filterSelector = await resolveFilterSelector(query, filterActions);
      const productSelector = await resolveProductSelector(query, filterActions, unchainedAPI);
      const sortStage = await resolveSortStage(query, filterActions);

      const searchConfiguration: SearchProductConfiguration = {
        query,
        filterSelector,
        productSelector,
        sortStage,
        forceLiveCollection,
        filterActions,
      };

      const productIds = await query.productIds;
      const totalProductIds = await productFulltextSearch(searchConfiguration)(productIds);

      if (query.productIds?.length === 0) {
        // Restricted to an empty array of products
        // will always lead to an empty result
        return {
          productsCount: async () => 0,
          filteredProductsCount: async () => 0,
          products: async () => [] as Array<Product>,
          filters: findFilters(
            { ...searchConfiguration, productIds: totalProductIds, filterProductIds },
            unchainedAPI,
          ),
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
