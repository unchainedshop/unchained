import { Db } from 'mongodb';
import { SortOption } from './api.js';
import { AssortmentMediaModule } from './assortments.media.js';
import { Filter, FindOptions, Query, TimestampFields, Tree, _ID } from './common.js';

export type Assortment = {
  _id?: _ID;
  isActive: boolean;
  isBase: boolean;
  isRoot: boolean;
  meta?: any;
  sequence: number;
  slugs: Array<string>;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentFilter = {
  _id?: _ID;
  assortmentId: string;
  filterId: string;
  meta?: any;
  sortKey: number;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentLink = {
  _id?: _ID;
  childAssortmentId: string;
  meta?: any;
  parentAssortmentId: string;
  sortKey: number;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentProduct = {
  _id?: _ID;
  assortmentId: string;
  meta?: any;
  productId: string;
  sortKey: number;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentProductIdCacheRecord = {
  _id?: _ID;
  productIds: Array<string>;
} & TimestampFields;

export type AssortmentText = {
  _id?: _ID;
  assortmentId: string;
  description?: string;
  locale: string;
  slug?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type AssortmentQuery = {
  queryString?: string;
  assortmentIds?: Array<string>;
  assortmentSelector?: Query;
  includeInactive?: boolean;
  includeLeaves?: boolean;
  slugs?: Array<string>;
  tags?: Array<string>;
};

export interface AssortmentPathLink {
  assortmentId: string;
  childAssortmentId: string;
  parentIds: string[];
}

export type AssortmentsModule = {
  // Queries
  assortmentExists: (query: { assortmentId?: string; slug?: string }) => Promise<boolean>;

  children: (query: { assortmentId: string; includeInactive?: boolean }) => Promise<Array<Assortment>>;

  count: (query: AssortmentQuery) => Promise<number>;

  findAssortment: (query: { assortmentId?: string; slug?: string }) => Promise<Assortment>;

  findAssortments: (
    query: AssortmentQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: FindOptions,
  ) => Promise<Array<Assortment>>;

  findProductIds: (params: {
    assortmentId: string;
    forceLiveCollection?: boolean;
    ignoreChildAssortments?: boolean;
  }) => Promise<Array<string>>;

  breadcrumbs: (params: {
    assortmentId?: string;
    productId?: string;
  }) => Promise<Array<{ links: Array<AssortmentPathLink> }>>;

  // Mutations
  create: (doc: Assortment & { title: string; locale: string }) => Promise<string>;

  update: (
    assortmentId: string,
    doc: Assortment,
    options?: { skipInvalidation?: boolean },
  ) => Promise<string>;

  delete: (assortmentId: string, options?: { skipInvalidation?: boolean }) => Promise<number>;

  invalidateCache: (params: AssortmentQuery, options?: { skipUpstreamTraversal: boolean }) => void;

  setBase: (assortmentId: string) => Promise<void>;

  /*
   * Assortment media
   */
  media: AssortmentMediaModule;

  /*
   * Assortment filters
   */
  filters: {
    // Queries
    findFilter: (
      params: { assortmentFilterId: string },

      options?: { skipInvalidation?: boolean },
    ) => Promise<AssortmentFilter>;
    findFilters: (
      params: {
        assortmentId: string;
      },
      options?: FindOptions,
    ) => Promise<Array<AssortmentFilter>>;
    findFilterIds: (params: { assortmentId: string }) => Promise<Array<string>>;

    // Mutations
    create: (doc: AssortmentFilter) => Promise<AssortmentFilter>;

    delete: (assortmentFilterId: string) => Promise<Array<{ _id: _ID }>>;
    deleteMany: (selector: Filter<AssortmentFilter>) => Promise<number>;

    update: (assortmentFilterId: string, doc: AssortmentFilter) => Promise<AssortmentFilter>;

    updateManualOrder: (params: {
      sortKeys: Array<{
        assortmentFilterId: string;
        sortKey: number;
      }>;
    }) => Promise<Array<AssortmentFilter>>;
  };

  /*
   * Assortment links
   */

  links: {
    // Queries
    findLink: (
      query: {
        assortmentLinkId?: string;
        parentAssortmentId?: string;
        childAssortmentId?: string;
      },
      options?: { skipInvalidation?: boolean },
    ) => Promise<AssortmentLink>;
    findLinks: (
      query: {
        assortmentId?: string;
        parentAssortmentId?: string;
      },
      options?: FindOptions,
    ) => Promise<Array<AssortmentLink>>;

    // Mutations
    create: (doc: AssortmentLink, options?: { skipInvalidation?: boolean }) => Promise<AssortmentLink>;

    delete: (
      assortmentLinkId: string,
      options?: { skipInvalidation?: boolean },
    ) => Promise<AssortmentLink>;

    deleteMany: (
      selector: Filter<AssortmentLink>,
      options?: { skipInvalidation?: boolean },
    ) => Promise<number>;

    update: (
      assortmentLinkId: string,
      doc: AssortmentLink,
      options?: { skipInvalidation?: boolean },
    ) => Promise<AssortmentLink>;

    updateManualOrder: (
      params: {
        sortKeys: Array<{
          assortmentLinkId: string;
          sortKey: number;
        }>;
      },
      options?: { skipInvalidation?: boolean },
    ) => Promise<Array<AssortmentLink>>;
  };

  /*
   * Assortment products
   */

  products: {
    // Queries
    findAssortmentIds: (params: { productId: string; tags?: Array<string> }) => Promise<Array<string>>;
    findProductIds: (params: { assortmentId: string; tags?: Array<string> }) => Promise<Array<string>>;

    findProduct: (params: { assortmentProductId: string }) => Promise<AssortmentProduct>;

    findProducts: (
      params: {
        assortmentId: string;
      },
      options?: FindOptions,
    ) => Promise<Array<AssortmentProduct>>;

    findProductSiblings: (params: {
      productId: string;
      assortmentIds: Array<string>;
    }) => Promise<Array<string>>;

    // Mutations
    create: (
      doc: AssortmentProduct,
      options?: { skipInvalidation?: boolean },
    ) => Promise<AssortmentProduct>;

    delete: (
      assortmentProductId: string,
      options?: { skipInvalidation?: boolean },
    ) => Promise<Array<{ _id: _ID; assortmentId: string }>>;

    deleteMany: (
      selector: Filter<AssortmentProduct>,
      options?: { skipInvalidation?: boolean },
    ) => Promise<number>;

    update: (
      assortmentProductId: string,
      doc: AssortmentProduct,
      options?: { skipInvalidation?: boolean },
    ) => Promise<AssortmentProduct>;

    updateManualOrder: (
      params: {
        sortKeys: Array<{
          assortmentProductId: string;
          sortKey: number;
        }>;
      },
      options?: { skipInvalidation?: boolean },
    ) => Promise<Array<AssortmentProduct>>;
  };

  /*
   * Assortment Filter Search
   */

  search: {
    findFilteredAssortments: (params: {
      assortmentIds: Array<string>;
      assortmentSelector: Query;
      limit: number;
      offset: number;
      sort: FindOptions['sort'];
    }) => Promise<Array<Assortment>>;
  };

  /*
   * Assortment texts
   */

  texts: {
    // Queries
    findTexts: (query: Query, options?: FindOptions) => Promise<Array<AssortmentText>>;

    findLocalizedText: (params: { assortmentId: string; locale?: string }) => Promise<AssortmentText>;
    searchTexts: ({ searchText }: { searchText: string }) => Promise<Array<string>>;

    // Mutations
    updateTexts: (
      assortmentId: string,
      texts: Array<Omit<AssortmentText, 'assortmentId'>>,
    ) => Promise<Array<AssortmentText>>;

    makeSlug: (data: { slug?: string; title: string; assortmentId: string }) => Promise<string>;

    deleteMany: ({
      assortmentId,
    }: {
      assortmentId?: string;
      excludedAssortmentIds?: string[];
    }) => Promise<number>;
  };
};

/*
 * Settings
 */

export interface AssortmentsSettingsOptions {
  zipTree?: (data: Tree<string>) => Array<string>;
  slugify?: (title: string) => string;
  setCachedProductIds?: (assortmentId: string, productIds: Array<string>) => Promise<number>;
  getCachedProductIds?: (assortmentId: string) => Promise<Array<string>>;
}

export interface AssortmentsSettings {
  zipTree?: (data: Tree<string>) => Array<string>;
  slugify?: (title: string) => string;
  setCachedProductIds?: (assortmentId: string, productIds: Array<string>) => Promise<number>;
  getCachedProductIds?: (assortmentId: string) => Promise<Array<string>>;
  configureSettings: (options?: AssortmentsSettingsOptions, db?: Db) => void;
}
