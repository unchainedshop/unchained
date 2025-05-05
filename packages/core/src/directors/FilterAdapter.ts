import { Assortment } from '@unchainedshop/core-assortments';
import { mongodb } from '@unchainedshop/mongodb';
import { BaseAdapter, IBaseAdapter } from '@unchainedshop/utils';
import { Product } from '@unchainedshop/core-products';
import { Filter, SearchQuery } from '@unchainedshop/core-filters';
import { Modules } from '../modules.js';

export interface FilterInputText {
  locale: string;
  title: string;
  subtitle?: string;
}

export interface FilterContext {
  filter?: Filter;
  searchQuery: SearchQuery;
}

export interface FilterAdapterActions {
  aggregateProductIds: (params: { productIds: string[] }) => string[];

  searchAssortments: (
    params: {
      assortmentIds: string[];
    },
    options: {
      filterSelector: mongodb.Filter<Filter>;
      assortmentSelector: mongodb.Filter<Assortment>;
      sortStage: mongodb.FindOptions['sort'];
      locale: Intl.Locale;
    },
  ) => Promise<string[]>;

  searchProducts: (
    params: {
      productIds: string[];
    },
    options: {
      filterSelector: mongodb.Filter<Filter>;
      productSelector: mongodb.Filter<Product>;
      sortStage: mongodb.FindOptions['sort'];
      locale: Intl.Locale;
    },
  ) => Promise<string[]>;

  transformFilterSelector: (
    query: mongodb.Filter<Filter>,
    options?: any,
  ) => Promise<mongodb.Filter<Filter>>;
  transformProductSelector: (
    query: mongodb.Filter<Product>,
    options?: { key?: string; value?: any },
  ) => Promise<mongodb.Filter<Product>>;
  transformSortStage: (
    sort: mongodb.FindOptions['sort'],
    options?: { key: string; value?: any },
  ) => Promise<mongodb.FindOptions['sort']>;
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
