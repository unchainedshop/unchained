import { Filter, FilterAdapterActions, FiltersModule } from '@unchainedshop/types/filters.js';
import { Product } from '@unchainedshop/types/products.js';
import { mongodb } from '@unchainedshop/mongodb';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { FilterDirector } from '../director/FilterDirector.js';
import { cleanQuery } from '../search/cleanQuery.js';
import { loadFilter } from '../search/loadFilter.js';
import { productFacetedSearch } from '../search/productFacetedSearch.js';
import defaultAssortmentSelector from '../search/defaultAssortmentSelector.js';
import defaultFilterSelector from '../search/defaultFilterSelector.js';
import defaultProductSelector from '../search/defaultProductSelector.js';
import defaultSortStage from '../search/resolveSortStage.js';
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
    }: SearchProductConfiguration & {
      filterActions: FilterAdapterActions;
      filterProductIds: FilterProductIds;
      productIds?: string[];
    },
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
    searchAssortments: async (rawSearchQuery, { forceLiveCollection }, unchainedAPI) => {
      const { modules } = unchainedAPI;

      const searchQuery = cleanQuery(rawSearchQuery);
      const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);
      const filterSelector = await filterActions.transformFilterSelector(
        defaultFilterSelector(searchQuery),
      );
      const assortmentSelector = defaultAssortmentSelector(searchQuery);
      const sortStage = await filterActions.transformSortStage(defaultSortStage(searchQuery));

      const searchConfiguration: SearchAssortmentConfiguration = {
        query: searchQuery,
        filterSelector,
        assortmentSelector,
        sortStage,
        forceLiveCollection,
      };

      const assortmentIds = await searchQuery.assortmentIds;
      const totalAssortmentIds =
        (await filterActions.searchAssortments({ assortmentIds }, searchConfiguration)) || [];

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

    searchProducts: async (rawSearchQuery, { forceLiveCollection }, unchainedAPI) => {
      const { modules } = unchainedAPI;

      const searchQuery = cleanQuery(rawSearchQuery);
      const filterActions = await FilterDirector.actions({ searchQuery }, unchainedAPI);
      const filterSelector = await filterActions.transformFilterSelector(
        defaultFilterSelector(searchQuery),
      );
      const productSelector = await filterActions.transformProductSelector(
        defaultProductSelector(searchQuery, unchainedAPI),
        {},
      );
      const sortStage = await filterActions.transformSortStage(defaultSortStage(searchQuery));

      const searchConfiguration: SearchProductConfiguration = {
        query: searchQuery,
        filterSelector,
        productSelector,
        sortStage,
        forceLiveCollection,
      };

      const productIds = await searchQuery.productIds;
      const totalProductIds =
        (await filterActions.searchProducts({ productIds }, searchConfiguration)) || [];

      if (searchQuery.productIds?.length === 0) {
        // Restricted to an empty array of products
        // will always lead to an empty result
        return {
          productsCount: async () => 0,
          filteredProductsCount: async () => 0,
          products: async () => [] as Array<Product>,
          filters: findFilters(
            { ...searchConfiguration, filterActions, productIds: totalProductIds, filterProductIds },
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
