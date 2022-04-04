import { Collection } from '@unchainedshop/types/common';
import { Filter, FiltersModule } from '@unchainedshop/types/filters';
import { Product } from '@unchainedshop/types/products';
import { FilterDirector } from '../director/FilterDirector';
import { assortmentFulltextSearch } from '../search/assortmentFulltextSearch';
import { cleanQuery } from '../search/cleanQuery';
import { loadFilter } from '../search/loadFilter';
import { productFacetedSearch } from '../search/productFacetedSearch';
import { productFulltextSearch } from '../search/productFulltextSearch';
import { resolveAssortmentSelector } from '../search/resolveAssortmentSelector';
import { resolveFilterSelector } from '../search/resolveFilterSelector';
import { resolveProductSelector } from '../search/resolveProductSelector';
import { resolveSortStage } from '../search/resolveSortStage';
import {
  FilterProductIds,
  SearchAssortmentConfiguration,
  SearchProductConfiguration,
} from '../search/search';

export const configureFilterSearchModule = ({
  Filters,
  filterProductIds,
}: {
  Filters: Collection<Filter>;
  filterProductIds: FilterProductIds;
}): FiltersModule['search'] => {
  return {
    searchAssortments: async (searchQuery, { forceLiveCollection }, requestContext) => {
      const { modules } = requestContext;
      const filterActions = await FilterDirector.actions({ searchQuery }, requestContext);

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

      const totalAssortmentIds = await assortmentFulltextSearch(
        searchConfiguration,
        filterActions,
      )(query?.productIds);

      const totalAssormentCount = async () =>
        modules.assortments.count({
          assortmentSelector,
          assortmentIds: totalAssortmentIds,
        });

      return {
        totalAssortments: totalAssormentCount,
        assortmentsCount: totalAssormentCount,
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

    searchProducts: async (searchQuery, { forceLiveCollection }, requestContext) => {
      const { modules } = requestContext;
      const filterActions = await FilterDirector.actions({ searchQuery }, requestContext);

      const query = cleanQuery(searchQuery);
      const filterSelector = await resolveFilterSelector(searchQuery, filterActions);
      const productSelector = await resolveProductSelector(searchQuery, filterActions, requestContext);
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
        const extractedFilterIds = filterSelector?._id?.$in || [];
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
              requestContext,
            );
          }),
        );
      };

      if (searchQuery.productIds?.length === 0) {
        // Restricted to an empty array of products
        // will always lead to an empty result
        return {
          totalProducts: async () => 0,
          productsCount: async () => 0,
          filteredProducts: async () => 0,
          filteredProductsCount: async () => 0,
          products: async () => [] as Array<Product>,
          filters: findFilters,
        };
      }

      const filteredProductIds = await productFacetedSearch(
        Filters,
        filterProductIds,
        searchConfiguration,
        requestContext,
      )(totalProductIds);

      const aggregatedTotalProductIds = filterActions.aggregateProductIds({
        productIds: totalProductIds,
      });

      const aggregatedFilteredProductIds = filterActions.aggregateProductIds({
        productIds: filteredProductIds,
      });

      return {
        totalProducts: async () =>
          modules.products.search.countFilteredProducts({
            productSelector,
            productIds: aggregatedTotalProductIds,
          }),
        productsCount: async () =>
          modules.products.search.countFilteredProducts({
            productSelector,
            productIds: aggregatedTotalProductIds,
          }),
        filteredProducts: async () =>
          modules.products.search.countFilteredProducts({
            productSelector,
            productIds: aggregatedFilteredProductIds,
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
