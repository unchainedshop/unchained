import { Assortment } from '@unchainedshop/core-assortments';
import { TimestampFields, mongodb } from '@unchainedshop/mongodb';
import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import { Product } from '@unchainedshop/core-products';
import { UnchainedCore } from '@unchainedshop/core';

export enum FilterType {
  SWITCH = 'SWITCH',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  RANGE = 'RANGE',
}

export type Filter = {
  _id?: string;
  isActive?: boolean;
  key: string;
  meta?: any;
  options: Array<string>;
  type: FilterType;
} & TimestampFields;

export type FilterInputText = { locale: string; title: string; subtitle?: string };

export type FilterOption = Filter & {
  filterOption: string;
};

export type FilterText = {
  filterId: string;
  filterOptionValue?: string;
  locale?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type FilterProductIdCacheRecord = {
  filterId: string;
  filterOptionValue?: string;
  productIds: string[];
};

export type SearchFilterQuery = Array<{ key: string; value?: string }>;

export type FilterQuery = {
  filterIds?: Array<string>;
  queryString?: string;
  includeInactive?: boolean;
};

export type SearchQuery = {
  assortmentIds?: Array<string>;
  filterIds?: Array<string>;
  filterQuery?: SearchFilterQuery;
  includeInactive?: boolean;
  orderBy?: string;
  productIds?: Array<string>;
  queryString?: string;
};

/*
 * Director
 */

export type FilterContext = {
  filter?: Filter;
  searchQuery: SearchQuery;
};

export interface FilterAdapterActions {
  aggregateProductIds: (params: { productIds: Array<string> }) => Array<string>;

  searchAssortments: (
    params: {
      assortmentIds: Array<string>;
    },
    options?: {
      filterSelector: mongodb.Filter<Filter>;
      assortmentSelector: mongodb.Filter<Assortment>;
      sortStage: mongodb.FindOptions['sort'];
    },
  ) => Promise<Array<string>>;

  searchProducts: (
    params: {
      productIds: Array<string>;
    },
    options?: {
      filterSelector: mongodb.Filter<Filter>;
      productSelector: mongodb.Filter<Product>;
      sortStage: mongodb.FindOptions['sort'];
    },
  ) => Promise<Array<string>>;

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

  actions: (params: FilterContext & UnchainedCore) => FilterAdapterActions;
};

export type IFilterDirector = IBaseDirector<IFilterAdapter> & {
  actions: (filterContext: FilterContext, unchainedAPI: UnchainedCore) => Promise<FilterAdapterActions>;
};
