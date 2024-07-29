import { log, LogLevel } from '@unchainedshop/logger';

import { IFilterAdapter } from '../types.js';

export const FilterAdapter: Omit<IFilterAdapter, 'key' | 'label' | 'version'> = {
  orderIndex: 0,

  actions: () => {
    return {
      // This function is called to check if a filter actually matches a certain productId
      aggregateProductIds: ({ productIds }) => {
        return productIds;
      },

      searchProducts: async ({ productIds }) => {
        return productIds;
      },

      searchAssortments: async ({ assortmentIds }) => {
        return assortmentIds;
      },

      transformSortStage: async (lastStage) => {
        return lastStage;
      },

      // return a selector that is applied to Products.find to find relevant products
      // if no key is provided, it expects either null for all products or a list of products that are relevant
      transformProductSelector: async (lastSelector) => {
        return lastSelector;
      },

      // return a selector that is applied to Filters.find to find relevant filters
      transformFilterSelector: async (lastSelector) => {
        return lastSelector;
      },
    };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
