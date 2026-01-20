import type { SearchQuery } from '@unchainedshop/core-filters';
import { FilterAdapter, type IPlugin, type IFilterAdapter } from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerProductSearchFilter({
  orderIndex = 0,
  search,
}: {
  orderIndex?: number;
  search: (params: SearchQuery & { queryString: string; locale: Intl.Locale }) => Promise<string[]>;
}): IPlugin {
  const adapter: IFilterAdapter = {
    ...FilterAdapter,

    key: `shop.unchained.filters.product-search-${crypto.randomUUID()}`,
    label: 'Product Search Filter (auto-generated)',
    version: '1.0.0',
    orderIndex,

    actions: (params) => {
      return {
        ...FilterAdapter.actions(params),

        async searchProducts({ productIds }, { locale }) {
          const { queryString, ...rest } = params.searchQuery;
          if (!queryString) return productIds;

          const restrictedProductIds = new Set(productIds || []);
          const foundProductIds = await search({ ...rest, queryString, locale });
          return foundProductIds.filter(
            restrictedProductIds.size === 0 ? Boolean : (id) => restrictedProductIds.has(id),
          );
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
