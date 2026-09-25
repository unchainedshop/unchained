import type { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

/**
 * Adapter lookup shared by every director: adapters live in the plugin registry and
 * are selected by the director's adapterType symbol, ordered by orderIndex.
 */
export const registryDirector = <Adapter extends IBaseAdapter>(
  adapterType: symbol,
): IBaseDirector<Adapter> => ({
  getAdapter: (key) =>
    (pluginRegistry.getAdapters(adapterType) as Adapter[]).find((adapter) => adapter.key === key) ||
    null,

  getAdapters: ({ adapterFilter } = {}) =>
    (pluginRegistry.getAdapters(adapterType) as Adapter[]).filter(adapterFilter || (() => true)),
});
