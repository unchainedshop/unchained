import { type IFilterAdapter, FilterAdapter } from '@unchainedshop/core';

export const StrictQualFilter: IFilterAdapter = {
  ...FilterAdapter,

  key: 'shop.unchained.filters.strict-qual',
  label: 'Simple Strict Equal DB Filter',
  version: '1.0.0',
  orderIndex: 0,

  actions: (params) => {
    return {
      ...FilterAdapter.actions(params),

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
