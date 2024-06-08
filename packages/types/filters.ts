import type { Db, FindOptions, Document, Filter as MongoDBFilter } from 'mongodb';
import { SortOption } from './api.js';
import { Assortment } from './assortments.js';
import { IBaseAdapter, IBaseDirector, TimestampFields } from './common.js';
import { UnchainedCore } from './core.js';
import { Product } from './products.js';

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

export type SearchProducts = {
  productsCount: () => Promise<number>;
  filteredProductsCount: () => Promise<number>;
  products: (params: { limit: number; offset: number }) => Promise<Array<Product>>;
};

export type SearchAssortments = {
  assortmentsCount: () => Promise<number>;
  assortments: (params: { limit: number; offset: number }) => Promise<Array<Assortment>>;
};

export type FiltersModule = {
  // Queries
  count: (query: FilterQuery) => Promise<number>;

  findFilter: (params: { filterId?: string; key?: string }) => Promise<Filter>;

  findFilters: (
    params: FilterQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: FindOptions<Document>,
  ) => Promise<Array<Filter>>;

  filterExists: (params: { filterId: string }) => Promise<boolean>;

  invalidateCache: (query: MongoDBFilter<Filter>, unchainedAPI: UnchainedCore) => Promise<void>;

  // Mutations
  create: (
    doc: Filter & { title: string; locale: string },
    unchainedAPI: UnchainedCore,
    options?: { skipInvalidation?: boolean },
  ) => Promise<Filter>;

  createFilterOption: (
    filterId: string,
    option: { value: string },
    unchainedAPI: UnchainedCore,
  ) => Promise<Filter>;

  update: (
    filterId: string,
    doc: Filter,
    unchainedAPI: UnchainedCore,
    options?: { skipInvalidation?: boolean },
  ) => Promise<string>;

  delete: (filterId: string) => Promise<number>;

  removeFilterOption: (
    params: {
      filterId: string;
      filterOptionValue?: string;
    },
    unchainedAPI: UnchainedCore,
  ) => Promise<Filter>;

  /*
   * Search
   */
  search: {
    searchProducts: (
      searchQuery: SearchQuery,
      params: { forceLiveCollection?: boolean },
      unchainedAPI: UnchainedCore,
    ) => Promise<SearchProducts>;

    searchAssortments: (
      searchQuery: SearchQuery,
      params: { forceLiveCollection?: boolean },
      unchainedAPI: UnchainedCore,
    ) => Promise<SearchAssortments>;
  };

  /*
   * Filter texts
   */

  texts: {
    // Queries
    findTexts: (query: MongoDBFilter<FilterText>, options?: FindOptions) => Promise<Array<FilterText>>;

    findLocalizedText: (params: {
      filterId: string;
      filterOptionValue?: string;
      locale?: string;
    }) => Promise<FilterText>;

    // Mutations
    updateTexts: (
      query: { filterId: string; filterOptionValue?: string },
      texts: Array<Omit<FilterText, 'filterId' | 'filterOptionValue'>>,
    ) => Promise<Array<FilterText>>;

    deleteMany: (params: { filterId?: string; excludedFilterIds?: string[] }) => Promise<number>;
  };
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

/* Settings */

export interface FiltersSettingsOptions {
  skipInvalidationOnStartup?: boolean;
  setCachedProductIds?: (
    filterId: string,
    productIds: Array<string>,
    productIdsMap: Record<string, Array<string>>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[Array<string>, Record<string, Array<string>>]>;
}

export interface FiltersSettings {
  skipInvalidationOnStartup?: boolean;
  setCachedProductIds?: (
    filterId: string,
    productIds: Array<string>,
    productIdsMap: Record<string, Array<string>>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[Array<string>, Record<string, Array<string>>]>;
  configureSettings: (options: FiltersSettingsOptions, db: Db) => void;
}
