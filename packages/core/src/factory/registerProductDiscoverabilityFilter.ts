import { FilterAdapter, FilterDirector } from '../core-index.ts';

export default function registerProductDiscoverabilityFilter({
  orderIndex = 0,
  hiddenTagValue = 'hidden',
}: {
  orderIndex?: number;
  hiddenTagValue?: string;
}) {
  FilterDirector.registerAdapter({
    ...FilterAdapter,

    key: `shop.unchained.filters.product-discoverability-${crypto.randomUUID()}`,
    label: 'Product Discoverability Filter (auto-generated)',
    version: '1.0.0',
    orderIndex,

    actions: (params) => {
      return {
        ...FilterAdapter.actions(params),

        transformProductFilterQuery: async (lastFilterQuery, options) => {
          const { key } = options || {};

          if (!key) {
            // When no specific key is provided, add tag exclusion filter
            return [...lastFilterQuery, { key: 'tags', value: { notEqual: hiddenTagValue } }];
          }
          return lastFilterQuery;
        },
      };
    },
  });
}
