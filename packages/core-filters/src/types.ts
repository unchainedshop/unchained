import type { FindOptions, Filter as MongoDBFilter } from 'mongodb';
import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import type { Assortment } from '@unchainedshop/core-assortments';
import type { TimestampFields } from '@unchainedshop/mongodb';
import { Product } from '@unchainedshop/types/products.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';

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
      filterSelector: MongoDBFilter<Filter>;
      assortmentSelector: MongoDBFilter<Assortment>;
      sortStage: FindOptions['sort'];
    },
  ) => Promise<Array<string>>;

  searchProducts: (
    params: {
      productIds: Array<string>;
    },
    options?: {
      filterSelector: MongoDBFilter<Filter>;
      productSelector: MongoDBFilter<Product>;
      sortStage: FindOptions['sort'];
    },
  ) => Promise<Array<string>>;

  transformFilterSelector: (
    query: MongoDBFilter<Filter>,
    options?: any,
  ) => Promise<MongoDBFilter<Filter>>;
  transformProductSelector: (
    query: MongoDBFilter<Product>,
    options?: { key?: string; value?: any },
  ) => Promise<MongoDBFilter<Product>>;
  transformSortStage: (
    sort: FindOptions['sort'],
    options?: { key: string; value?: any },
  ) => Promise<FindOptions['sort']>;
}

export type IFilterAdapter = IBaseAdapter & {
  orderIndex: number;

  actions: (params: FilterContext & UnchainedCore) => FilterAdapterActions;
};

export type IFilterDirector = IBaseDirector<IFilterAdapter> & {
  actions: (filterContext: FilterContext, unchainedAPI: UnchainedCore) => Promise<FilterAdapterActions>;
};
