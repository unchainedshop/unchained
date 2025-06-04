import { IFilterAdapter, FilterDirector, FilterAdapter } from '@unchainedshop/core';

const StrictQualFilter: IFilterAdapter = {
  ...FilterAdapter,

  key: 'shop.unchained.filters.strict-qual',
  label: 'Simple Strict Equal DB Filter',
  version: '1.0.0',
  orderIndex: 0,

  actions: (params) => {
    return {
      ...FilterAdapter.actions(params),

      searchProducts: async ({ productIds }) => {
        // Search Products
        const { queryString } = params.searchQuery;

        if (!queryString && !productIds) {
          // If no query string is provided, return all product IDs
          return params.modules.products.findProductIds({});
        }
        return productIds;
      },

      searchAssortments: async ({ assortmentIds }) => {
        // Search Assortments
        const { queryString } = params.searchQuery;
        if (!queryString && !assortmentIds) {
          // If no query string is provided, return all assortment IDs
          return params.modules.assortments.findAssortmentIds({});
        }
        return assortmentIds;
      },

      transformProductSelector: async (lastSelector, options) => {
        const { key, value } = options || {};

        if (key) {
          return {
            ...lastSelector,
            [key]: value !== undefined ? value : { $exists: true },
          };
        }
        return lastSelector;
      },
    };
  },
};

FilterDirector.registerAdapter(StrictQualFilter);
