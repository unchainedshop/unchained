import { type IFilterAdapter, FilterDirector, FilterAdapter } from '@unchainedshop/core';

const StrictQualFilter: IFilterAdapter = {
  ...FilterAdapter,

  key: 'shop.unchained.filters.strict-qual',
  label: 'Simple Strict Equal DB Filter',
  version: '1.0.0',
  orderIndex: 0,

  actions: (params) => {
    return {
      ...FilterAdapter.actions(params),

      transformProductFilterQuery: async (lastFilterQuery, options) => {
        const { key, value } = options || {};

        if (key) {
          // Add filter item for this key/value pair
          return [...lastFilterQuery, { key, value: value !== undefined ? value : { $exists: true } }];
        }
        return lastFilterQuery;
      },
    };
  },
};

FilterDirector.registerAdapter(StrictQualFilter);
