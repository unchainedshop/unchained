import { BaseAdapter, type IBaseAdapter } from '@unchainedshop/utils';
import type { Modules } from '../modules.ts';

export interface SearchContext {
  queryString: string;
  locale?: Intl.Locale;
  userId?: string;
}

export interface SearchAdapterActions {
  searchProducts: () => Promise<string[]>;
  searchAssortments: () => Promise<string[]>;
  searchUsers: () => Promise<string[]>;
  searchOrders: () => Promise<string[]>;
  searchQuotations: () => Promise<string[]>;
  searchEnrollments: () => Promise<string[]>;
  searchDeliveryProviders: () => Promise<string[]>;
  searchPaymentProviders: () => Promise<string[]>;
  searchWarehousingProviders: () => Promise<string[]>;
  search: (entityType: string) => Promise<string[]>;
}

export type ISearchAdapter = IBaseAdapter & {
  orderIndex: number;
  actions: (context: SearchContext, options: { modules: Modules }) => SearchAdapterActions;
};

// Base adapter returns empty arrays (no search capability)
// Concrete adapters (FTS5, Algolia, etc.) provide actual implementation
export const SearchAdapter: Omit<ISearchAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
  orderIndex: 0,

  actions: () => ({
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
  }),
};
