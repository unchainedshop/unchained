import { BaseAdapter, type IBaseAdapter } from '@unchainedshop/utils';
import type {
  Filter,
  FilterSelector,
  SearchConfiguration,
  SearchQuery,
  SortStage,
} from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';

export interface FilterInputText {
  locale: string;
  title: string;
  subtitle?: string;
}

export interface FilterContext {
  filter?: Filter;
  searchQuery: SearchQuery;
}

// Filter query item for products - key/value pairs that map to product fields
export interface ProductFilterQueryItem {
  key: string;
  value: unknown;
}

// Assortment selector type for search operations
export interface AssortmentSelector {
  _id?: string | { $in: string[] };
  isActive?: boolean;
  isRoot?: boolean;
}

export interface SearchAssortmentsOptions extends SearchConfiguration {
  assortmentSelector: AssortmentSelector;
}

export interface SearchProductsOptions extends SearchConfiguration {
  productFilterQuery: ProductFilterQueryItem[];
}

export interface TransformOptions {
  key?: string;
  value?: any;
  userId?: string;
  locale?: Intl.Locale;
}

export interface FilterAdapterActions {
  aggregateProductIds: (params: { productIds: string[] }) => string[];

  searchAssortments: (
    params: {
      assortmentIds?: string[];
    },
    options: SearchAssortmentsOptions,
  ) => Promise<string[] | undefined>;

  searchProducts: (
    params: {
      productIds?: string[];
    },
    options: SearchProductsOptions,
  ) => Promise<string[] | undefined>;

  transformFilterSelector: (
    query: FilterSelector,
    options?: TransformOptions,
  ) => Promise<FilterSelector>;

  // Transforms product filter query - returns filter items to be applied to product search
  transformProductFilterQuery: (
    query: ProductFilterQueryItem[],
    options?: TransformOptions,
  ) => Promise<ProductFilterQueryItem[]>;

  transformSortStage: (sort: SortStage, options?: TransformOptions) => Promise<SortStage>;
}

export type IFilterAdapter = IBaseAdapter & {
  orderIndex: number;

  actions: (params: FilterContext & { modules: Modules }) => FilterAdapterActions;
};

export const FilterAdapter: Omit<IFilterAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
  orderIndex: 0,

  actions: () => {
    return {
      // This function is called to check if a filter actually matches a certain productId
      aggregateProductIds: ({ productIds }) => {
        return productIds;
      },

      searchProducts: async ({ productIds }) => {
        return productIds;
      },

      searchAssortments: async ({ assortmentIds }) => {
        return assortmentIds;
      },

      transformSortStage: async (lastStage) => {
        return lastStage;
      },

      // return filter query items to be applied to Products.find
      // if no key is provided, it expects either null for all products or a list of filter items
      transformProductFilterQuery: async (lastQuery) => {
        return lastQuery;
      },

      // return a selector that is applied to Filters.find to find relevant filters
      transformFilterSelector: async (lastSelector) => {
        return lastSelector;
      },
    };
  },
};
