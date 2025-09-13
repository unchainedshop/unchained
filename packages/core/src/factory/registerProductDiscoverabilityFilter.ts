import { randomBytes } from 'crypto';
import { FilterAdapter, FilterDirector } from '../core-index.js';

export default function registerProductDiscoverabilityFilter({
  orderIndex = 0,
  hiddenTagValue = 'hidden',
}: {
  orderIndex?: number;
  hiddenTagValue?: string;
}) {
  FilterDirector.registerAdapter({
    ...FilterAdapter,

    key: `shop.unchained.filters.product-discoverability-${randomBytes(4).toString('hex')}`,
    label: 'Product Discoverability Filter',
    version: '1.0.0',
    orderIndex,

    actions: (params) => {
      return {
        ...FilterAdapter.actions(params),

        transformProductSelector: async (lastSelector, options) => {
          const { key } = options || {};

          if (!key) {
            const newSelector = { ...lastSelector };
            if (!newSelector.$and) newSelector.$and = [];
            newSelector.$and.push({ tags: { $ne: hiddenTagValue } });
            return newSelector;
          }
          return lastSelector;
        },
      };
    },
  });
}
