import type { SearchQuery } from '@unchainedshop/core-filters';
import { FilterAdapter, type IPlugin, type IFilterAdapter } from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export default function registerAssortmentSearchFilter({
  orderIndex = 0,
  search,
}: {
  orderIndex?: number;
  search: (params: SearchQuery & { queryString: string; locale: Intl.Locale }) => Promise<string[]>;
}): IPlugin {
  const adapter: IFilterAdapter = {
    ...FilterAdapter,

    key: `shop.unchained.filters.assortment-search-${crypto.randomUUID()}`,
    label: 'Assortment Search Filter (auto-generated)',
    version: '1.0.0',
    orderIndex,

    actions: (params) => {
      return {
        ...FilterAdapter.actions(params),

        async searchAssortments({ assortmentIds }, { locale }) {
          const { queryString, ...rest } = params.searchQuery;
          if (!queryString) return assortmentIds;

          const restrictedAssortmentIds = new Set(assortmentIds || []);
          const foundAssortmentIds = await search({ ...rest, queryString, locale });
          return foundAssortmentIds.filter(
            restrictedAssortmentIds.size === 0 ? Boolean : (id) => restrictedAssortmentIds.has(id),
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
