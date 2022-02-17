import { Context } from './api';
import { Assortment } from './assortments';
import { FindOptions, IBaseAdapter, IBaseDirector, Query, TimestampFields, _ID } from './common';
import { Product } from './products';

export enum FilterType {
  SWITCH = 'SWITCH',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  RANGE = 'RANGE',
}

export type FilterCache = {
  allProductIds?: Array<string>;
  productIds?: Array<string>;
  compressed?: any;
};

export type Filter = {
  _id?: _ID;
  _cache?: FilterCache;
  authorId: string;
  isActive?: boolean;
  key: string;
  meta?: any;
  options: Array<string>;
  type: FilterType;
} & TimestampFields;

export type FilterOption = Filter & {
  filterOption: string;
};

export type FilterText = {
  authorId: string;
  filterId: string;
  filterOptionValue?: string;
  locale?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type SearchFilterQuery = Array<{ key: string; value?: string }>;

type FilterQuery = {
  includeInactive?: boolean;
};

export type SearchQuery = Query & {
  assortmentIds?: Array<string>;
  filterIds?: Array<string>;
  filterQuery?: SearchFilterQuery;
  includeInactive?: boolean;
  orderBy?: string;
  productIds?: Array<string>;
  queryString?: string;
};

export type SearchProducts = {
  totalProducts: () => Promise<number>; // @deprecated: Reason: "Renamed, use the productsCount field"
  productsCount: () => Promise<number>;
  filteredProducts: () => Promise<number>; // @deprecated: Reason: "Renamed, use the filteredProductsCount field"
  filteredProductsCount: () => Promise<number>;
  // filters: () => Array<LoadedFilter>;
  products: (params: { limit: number; offset: number }) => Promise<Array<Product>>;
};

export type SearchAssortments = {
  totalAssortments: () => Promise<number>; // @deprecated: Reason: "Renamed, use the assortmentsCount field"
  assortmentsCount: () => Promise<number>;
  assortments: (params: { limit: number; offset: number }) => Promise<Array<Assortment>>;
};

export type FiltersModule = {
  // Queries
  count: (query: FilterQuery) => Promise<number>;

  findFilter: (params: { filterId: string }) => Promise<Filter>;

  findFilters: (
    params: FilterQuery & {
      limit?: number;
      offset?: number;
    },
  ) => Promise<Array<Filter>>;

  filterExists: (params: { filterId: string }) => Promise<boolean>;

  invalidateCache: (query: Query, requestContext: Context) => Promise<void>;

  // Mutations
  create: (
    doc: Filter & { title: string; locale: string },
    requestContext: Context,
    options?: { skipInvalidation?: boolean },
  ) => Promise<Filter>;

  createFilterOption: (
    filterId: string,
    option: { value: string; title: string },
    requestContext: Context,
  ) => Promise<Filter>;

  update: (
    filterId: string,
    doc: Filter,
    requestContext: Context,
    options?: { skipInvalidation?: boolean },
  ) => Promise<Filter>;

  delete: (
    filterId: string,
    requestContext: Context,
    options?: { skipInvalidation?: boolean },
  ) => Promise<number>;

  removeFilterOption: (
    params: {
      filterId: string;
      filterOptionValue?: string;
    },
    userId?: string,
  ) => Promise<Filter>;

  /*
   * Search
   */
  search: {
    searchProducts: (
      searchQuery: SearchQuery,
      params: { forceLiveCollection?: boolean },
      requestContext: Context,
    ) => Promise<SearchProducts>;

    searchAssortments: (
      searchQuery: SearchQuery,
      params: { forceLiveCollection?: boolean },
      requestContext: Context,
    ) => Promise<SearchAssortments>;
  };

  /*
   * Filter texts
   */

  texts: {
    // Queries
    findTexts: (params: { filterId: string; filterOptionValue?: string }) => Promise<Array<FilterText>>;

    findLocalizedText: (params: {
      filterId: string;
      filterOptionValue?: string;
      locale?: string;
    }) => Promise<FilterText>;

    // Mutations
    updateTexts: (
      query: { filterId: string; filterOptionValue?: string },
      texts: Array<{ locale: string; title?: string; subtitle?: string }>,
      userId?: string,
    ) => Promise<Array<FilterText>>;

    upsertLocalizedText: (
      params: { filterId: string; filterOptionValue?: string },
      locale: string,
      text: FilterText,
      userId?: string,
    ) => Promise<FilterText>;

    deleteMany: (filterId: string, userId?: string) => Promise<number>;
  };
};

/*
 * Director
 */

type FilterContext = {
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
      filterSelector: Query;
      assortmentSelector: Query;
      sortStage: FindOptions['sort'];
    },
  ) => Promise<Array<string>>;

  searchProducts: (
    params: {
      productIds: Array<string>;
    },
    options?: {
      filterSelector: Query;
      productSelector: Query;
      sortStage: FindOptions['sort'];
    },
  ) => Promise<Array<string>>;

  transformFilterSelector: (query: Query, options?: any) => Promise<Query>;
  transformProductSelector: (query: Query, options?: { key: string; value?: any }) => Promise<Query>;
  transformSortStage: (
    sort: FindOptions['sort'],
    options?: { key: string; value?: any },
  ) => Promise<FindOptions['sort']>;
}

export type IFilterAdapter = IBaseAdapter & {
  orderIndex: number;

  actions: (params: FilterContext & Context) => FilterAdapterActions;
};

export type IFilterDirector = IBaseDirector<IFilterAdapter> & {
  actions: (filterContext: FilterContext, requestContext: Context) => FilterAdapterActions;
};
