import type { IBaseAdapter } from './BaseAdapter.ts';

// Directors in @unchainedshop/core implement this against the plugin registry.
export interface IBaseDirector<Adapter extends IBaseAdapter> {
  getAdapters: (options?: { adapterFilter?: (adapter: Adapter) => boolean }) => Adapter[];
  getAdapter: (key: string) => Adapter | null;
}
