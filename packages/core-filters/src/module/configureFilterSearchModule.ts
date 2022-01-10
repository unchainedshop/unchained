import { Context } from '@unchainedshop/types/api';
import { Collection } from '@unchainedshop/types/common';
import {
  Filter,
  FiltersModule,
  FilterText,
} from '@unchainedshop/types/filters';
import { Product } from '@unchainedshop/types/products';
import { dbIdToString } from 'meteor/unchained:utils';
import { FilterDirector } from 'src/director/FilterDirector';
import { assortmentFulltextSearch } from 'src/search/assortmentFulltextSearch';
import { cleanQuery } from 'src/search/cleanQuery';
import { loadFilter } from 'src/search/loadFilter';
import { productFacetedSearch } from 'src/search/productFacetedSearch';
import { productFulltextSearch } from 'src/search/productFulltextSearch';
import { resolveAssortmentSelector } from 'src/search/resolveAssortmentSelector';
import { resolveFilterSelector } from 'src/search/resolveFilterSelector';
import { resolveProductSelector } from 'src/search/resolveProductSelector';
import { resolveSortStage } from 'src/search/resolveSortStage';
import {
  FilterProductIds,
  SearchAssortmentConfiguration,
  SearchConfiguration,
  SearchProductConfiguration,
} from 'src/search/search';

export const configureFilterSearchModule = ({
  Filters,
  filterProductIds,
}: {
  Filters: Collection<Filter>;
  filterProductIds: FilterProductIds;
}): FiltersModule['search'] => {
  return {
    searchAssortments: async (
      searchQuery,
      { forceLiveCollection },
      requestContext
    ) => {
      const { modules } = requestContext;
      const filterActions = FilterDirector.actions(
        { searchQuery },
        requestContext
      );

      const query = cleanQuery(searchQuery);
      const filterSelector = await resolveFilterSelector(
        searchQuery,
        filterActions
      );
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
        filterActions
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
          await modules.assortments.search.findFilteredAssortments({
            limit,
            offset,
            assortmentIds: totalAssortmentIds,
            assortmentSelector,
            sort: sortStage,
          }),
      };
    },

    searchProducts: async (
      searchQuery,
      { forceLiveCollection },
      requestContext
    ) => {
      const { modules } = requestContext;
      const filterActions = FilterDirector.actions(
        { searchQuery },
        requestContext
      );

      const query = cleanQuery(searchQuery);
      const filterSelector = await resolveFilterSelector(
        searchQuery,
        filterActions
      );
      const productSelector = await resolveProductSelector(
        searchQuery,
        filterActions,
        requestContext
      );
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
        filterActions
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
          }
        );
        const relevantProductIds = relevantProducts.map(({ _id }) =>
          dbIdToString(_id)
        );

        return await Promise.all(
          sortedFilters.map(async (filter) => {
            return await loadFilter(
              filter,
              {
                allProductIds: relevantProductIds,
                filterQuery: query.filterQuery,
                forceLiveCollection,
                otherFilters,
              },
              filterProductIds,
              filterActions,
              requestContext
            );
          })
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
        requestContext
      )(totalProductIds);
      const aggregatedProductIds = filterActions.aggregateProductIds({
        productIds: filteredProductIds,
      });

      const countProducts = modules.products.count;

      return {
        totalProducts: async () =>
          await countProducts({
            productSelector,
            productIds: filterActions.aggregateProductIds({
              productIds: totalProductIds,
            }),
          }),
        productsCount: async () =>
          await countProducts({
            productSelector,
            productIds: totalProductIds,
          }),
        filteredProducts: async () =>
          await countProducts({
            productSelector,
            productIds: aggregatedProductIds,
          }),
        filteredProductsCount: async () =>
          await countProducts({
            productSelector,
            productIds: filteredProductIds,
          }),
        products: async ({ offset, limit }) =>
          await modules.products.search.findFilteredProducts({
            limit,
            offset,
            productIds: aggregatedProductIds,
            productSelector,
            sort: sortStage,
          }),
        filters: findFilters,
      };
    },
  };
};
