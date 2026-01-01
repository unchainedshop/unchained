import { FilterDirector, FilterAdapter, type IFilterAdapter } from '@unchainedshop/core';

const LocalSearch: IFilterAdapter = {
  ...FilterAdapter,

  key: 'shop.unchained.filters.local-search',
  label: 'Simple Fulltext search with Drizzle',
  version: '1.0.0',
  orderIndex: 10,

  actions: (params) => {
    return {
      ...FilterAdapter.actions(params),

      searchProducts: async ({ productIds }) => {
        // Search Products
        const { queryString } = params.searchQuery;

        if (!queryString) return productIds;

        const products = await params.modules.products.texts.findTexts({
          queryString,
          productIds: productIds ? [...new Set(productIds)] : undefined,
        });

        return products.map(({ productId }) => productId);
      },

      searchAssortments: async ({ assortmentIds }) => {
        const { queryString } = params.searchQuery;

        if (!queryString) {
          return assortmentIds;
        }

        const assortments = await params.modules.assortments.texts.findTexts(
          {
            queryString,
            assortmentIds,
          },
          {
            fields: ['assortmentId'],
          },
        );

        return assortments.map(({ assortmentId }) => assortmentId);
      },

      async transformFilterSelector(last) {
        const { queryString, filterIds, includeInactive } = params.searchQuery;

        if (queryString && !filterIds) {
          // Global search without assortment scope:
          // Return all filters
          const selector = { ...last };
          if (selector?.key) {
            // Do not restrict to keys
            delete selector.key;
          }
          if (!includeInactive) {
            // Include only active filters
            selector.isActive = true;
          }
          return selector;
        }

        return last;
      },
    };
  },
};

export default LocalSearch;

FilterDirector.registerAdapter(LocalSearch);
