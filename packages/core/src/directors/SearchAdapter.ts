import { BaseAdapter, type IBaseAdapter } from '@unchainedshop/utils';
import type { Modules } from '../modules.ts';

export const SearchEntityType = {
  PRODUCT: 'PRODUCT',
  PRODUCT_TEXT: 'PRODUCT_TEXT',
  PRODUCT_REVIEW: 'PRODUCT_REVIEW',
  ASSORTMENT: 'ASSORTMENT',
  ASSORTMENT_TEXT: 'ASSORTMENT_TEXT',
  USER: 'USER',
  ORDER: 'ORDER',
  QUOTATION: 'QUOTATION',
  ENROLLMENT: 'ENROLLMENT',
  FILTER: 'FILTER',
  FILTER_TEXT: 'FILTER_TEXT',
  COUNTRY: 'COUNTRY',
  CURRENCY: 'CURRENCY',
  LANGUAGE: 'LANGUAGE',
  EVENT: 'EVENT',
  WORK_QUEUE: 'WORK_QUEUE',
  TOKEN_SURROGATE: 'TOKEN_SURROGATE',
  DELIVERY_PROVIDER: 'DELIVERY_PROVIDER',
  PAYMENT_PROVIDER: 'PAYMENT_PROVIDER',
  WAREHOUSING_PROVIDER: 'WAREHOUSING_PROVIDER',
} as const;

export type SearchEntityType = (typeof SearchEntityType)[keyof typeof SearchEntityType];

export interface SearchContext {
  queryString: string;
  locale?: Intl.Locale;
  userId?: string;
}

export interface SearchAdapterActions {
  // Search for entities by query string
  search: (entityType: SearchEntityType) => Promise<string[]>;

  // Index/update an entity in the search index
  indexEntity: (
    entityType: SearchEntityType,
    entityId: string,
    data: Record<string, string | null | undefined>,
  ) => Promise<void>;

  // Remove an entity from the search index
  removeEntity: (entityType: SearchEntityType, entityId: string) => Promise<void>;

  // Clear all entries for an entity type
  clearEntities: (entityType: SearchEntityType) => Promise<void>;
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
    search: async () => [],
    indexEntity: async () => {
      /* */
    },
    removeEntity: async () => {
      /* */
    },
    clearEntities: async () => {
      /* */
    },
  }),
};
