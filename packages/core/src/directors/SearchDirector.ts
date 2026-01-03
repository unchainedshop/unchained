import { BaseDirector } from '@unchainedshop/utils';
import type { ISearchAdapter, SearchContext, SearchAdapterActions } from './SearchAdapter.ts';
import type { Modules } from '../modules.ts';

export interface ISearchDirector {
  getAdapters: (options?: { adapterFilter?: (adapter: ISearchAdapter) => boolean }) => ISearchAdapter[];
  getAdapter: (key: string) => ISearchAdapter | null;
  registerAdapter: (adapter: ISearchAdapter) => void;
  unregisterAdapter: (key: string) => boolean;

  // Convenience methods for search operations
  actions: (context: SearchContext, options: { modules: Modules }) => SearchAdapterActions;
}

const baseDirector = BaseDirector<ISearchAdapter>('SearchDirector', {
  adapterSortKey: 'orderIndex',
});

export const SearchDirector: ISearchDirector = {
  ...baseDirector,

  actions: (context, options) => {
    const adapters = baseDirector.getAdapters();

    // If no adapters registered, return no-op actions
    if (!adapters.length) {
      return {
        searchProducts: async () => [],
        searchAssortments: async () => [],
        searchUsers: async () => [],
        searchOrders: async () => [],
        searchQuotations: async () => [],
        searchEnrollments: async () => [],
        searchDeliveryProviders: async () => [],
        searchPaymentProviders: async () => [],
        searchWarehousingProviders: async () => [],
        search: async () => [],
      };
    }

    // Use first adapter (lowest orderIndex)
    const adapter = adapters[0];
    return adapter.actions(context, options);
  },
};
