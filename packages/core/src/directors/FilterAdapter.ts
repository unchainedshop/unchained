import type { Assortment } from '@unchainedshop/core-assortments';
import { mongodb } from '@unchainedshop/mongodb';
import { BaseAdapter, type IBaseAdapter } from '@unchainedshop/utils';
import type { Product } from '@unchainedshop/core-products';
import type { Filter, SearchConfiguration, SearchQuery } from '@unchainedshop/core-filters';
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

export interface SearchAssortmentsOptions extends SearchConfiguration {
  assortmentSelector: mongodb.Filter<Assortment>;
}

export interface SearchProductsOptions extends SearchConfiguration {
  productSelector: mongodb.Filter<Product>;
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
    query: mongodb.Filter<Filter>,
    options?: TransformOptions,
  ) => Promise<mongodb.Filter<Filter>>;
  transformProductSelector: (
    query: mongodb.Filter<Product>,
    options?: TransformOptions,
  ) => Promise<mongodb.Filter<Product>>;
  transformSortStage: (
    sort: mongodb.FindOptions['sort'],
    options?: TransformOptions,
  ) => Promise<mongodb.FindOptions['sort']>;
}

export type IFilterAdapter = IBaseAdapter & {
  orderIndex: number;

  actions: (params: FilterContext & { modules: Modules }) => FilterAdapterActions;
};

export const FilterAdapter: Omit<IFilterAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
  adapterType: Symbol.for('unchained:adapter:filter'),
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

      // return a selector that is applied to Products.find to find relevant products
      // if no key is provided, it expects either null for all products or a list of products that are relevant
      transformProductSelector: async (lastSelector) => {
        return lastSelector;
      },

      // return a selector that is applied to Filters.find to find relevant filters
      transformFilterSelector: async (lastSelector) => {
        return lastSelector;
      },
    };
  },
};
