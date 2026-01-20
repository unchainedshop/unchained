import { FilterAdapter, type IPlugin, type IFilterAdapter } from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerProductDiscoverabilityFilter({
  orderIndex = 0,
  hiddenTagValue = 'hidden',
}: {
  orderIndex?: number;
  hiddenTagValue?: string;
}): IPlugin {
  const adapter: IFilterAdapter = {
    ...FilterAdapter,

    key: `shop.unchained.filters.product-discoverability-${crypto.randomUUID()}`,
    label: 'Product Discoverability Filter (auto-generated)',
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
  };

  const plugin: IPlugin = {
    key: adapter.key,
    label: adapter.label,
    version: adapter.version,
    adapters: [adapter],
  };

  pluginRegistry.register(plugin);
  return plugin;
}
