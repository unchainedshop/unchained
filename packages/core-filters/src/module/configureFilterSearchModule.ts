import { Context } from '@unchainedshop/types/api';
import { Collection } from '@unchainedshop/types/common';
import {
  Filter,
  FiltersModule,
  FilterText,
} from '@unchainedshop/types/filters';
import { FilterDirector } from 'src/director/FilterDirector';
import { cleanQuery } from 'src/search/cleanQuery';
import { productFacetedSearch } from 'src/search/productFacetedSearch';
import { productFulltextSearch } from 'src/search/productFulltextSearch';
import { resolveFilterSelector } from 'src/search/resolveFilterSelector';
import { resolveProductSelector } from 'src/search/resolveProductSelector';
import { resolveSortStage } from 'src/search/resolveSortStage';
import { FilterProductIds, SearchConfiguration } from 'src/search/search';

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
    ) => {},

    searchProducts: async (
      searchQuery,
      { forceLiveCollection },
      requestContext
    ) => {
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

      const searchConfiguration: SearchConfiguration = {
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
        const resolvedFilterSelector = await filterSelector;
        const extractedFilterIds = resolvedFilterSelector?._id?.$in || [];
        const otherFilters = await Filters.find(
          resolvedFilterSelector
        ).toArray();
        const sortedFilters = otherFilters.sort((left, right) => {
          const leftIndex = extractedFilterIds.indexOf(left._id);
          const rightIndex = extractedFilterIds.indexOf(right._id);
          return leftIndex - rightIndex;
        });

        const relevantProducts =
          await requestContext.modules.products.findProducts(
            {
              ...productSelector,
              _id: { $in: totalProductIds },
            },
            {
              projection: { _id: 1 },
            }
          );
        const relevantProductIds = relevantProducts.map(({ _id }) => _id);

        return sortedFilters.map((filter) => {
          return filter.load({
            ...query,
            director,
            allProductIdsSet: new Set(relevantProductIds),
            otherFilters,
            context,
          });
        });
      };

      if (searchQuery.productIds?.length === 0) {
        // Restricted to an empty array of products
        // will always lead to an empty result
        return {
          totalProducts: 0,
          productsCount: 0,
          filteredProducts: 0,
          filteredProductsCount: 0,
          products: () => [],
          filters: findFilters,
        };
      }

      const filteredProductIds = await productFacetedSearch(
        Filters,
        filterProductIds,
        searchConfiguration,
        requestContext
      );

      const countProducts = requestContext.modules.products.count;

      return {
        totalProducts: async () =>
          await countProducts({
            ...productSelector,
            _id: {
              $in: filterActions.aggregateProductIds({
                productIds: totalProductIds,
              }),
            },
          }),
        productsCount: async () =>
          await countProducts({
            ...productSelector,
            _id: { $in: await totalProductIds },
          }),
        filteredProducts: async () =>
          await countProducts({
            ...productSelector,
            _id: {
              $in: filterActions.aggregateProductIds({
                productIds: filteredProductIds,
              }),
            },
          }),
        filteredProductsCount: async () =>
          await countProducts({
            ...productSelector,
            _id: { $in: filteredProductIds },
          }),
        products: async ({ offset, limit }) =>
          findPreservingIds(Products)(
            productSelector,
            filterActions.aggregateProductIds({
              productIds: filteredProductIds,
            }),
            {
              skip: offset,
              limit,
              sort: sortStage,
            }
          ),
        filters: findFilters,
      };
    },
  };
};
