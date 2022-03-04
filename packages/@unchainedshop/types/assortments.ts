import { AssortmentMediaModule } from './assortments.media';
import { Filter, FindOptions, Query, TimestampFields, _ID } from './common';

export type Assortment = {
  _id?: _ID;
  authorId: string;
  isActive: boolean;
  isBase: boolean;
  isRoot: boolean;
  meta?: any;
  sequence: number;
  slugs: Array<string>;
  tags: Array<string>;
  _cachedProductIds: Array<string>;
} & TimestampFields;

export type AssortmentFilter = {
  _id?: _ID;
  assortmentId: string;
  authorId: string;
  filterId: string;
  meta?: any;
  sortKey: number;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentLink = {
  _id?: _ID;
  authorId: string;
  childAssortmentId: string;
  meta?: any;
  parentAssortmentId: string;
  sortKey: number;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentProduct = {
  _id?: _ID;
  assortmentId: string;
  authorId: string;
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
  authorId: string;
  description?: string;
  locale: string;
  slug?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type AssortmentQuery = {
  assortmentIds?: Array<string>;
  assortmentSelector?: Query;
  includeInactive?: boolean;
  includeLeaves?: boolean;
  slugs?: Array<string>;
  tags?: Array<string>;
};

export interface AssortmentPathLink {
  assortmentId: string;
  assortmentSlug: string;
  assortmentTexts: AssortmentText;
  link: AssortmentLink;
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
  create: (doc: Assortment & { title: string; locale: string }, userId: string) => Promise<string>;

  update: (assortmentId: string, doc: Assortment, userId: string) => Promise<string>;

  delete: (
    assortmentId: string,
    options?: { skipInvalidation?: boolean },
    userId?: string,
  ) => Promise<number>;

  invalidateCache: (params: { assortmentIds: Array<string> }, userId?: string) => void;

  setBase: (assortmentId: string, userId?: string) => Promise<void>;

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
    create: (doc: AssortmentFilter, userId?: string) => Promise<AssortmentFilter>;

    delete: (assortmentFilterId: string, userId?: string) => Promise<Array<{ _id: _ID }>>;
    deleteMany: (selector: Filter<AssortmentFilter>, userId?: string) => Promise<Array<{ _id: _ID }>>;

    update: (assortmentFilterId: string, doc: AssortmentFilter) => Promise<AssortmentFilter>;

    updateManualOrder: (
      params: {
        sortKeys: Array<{
          assortmentFilterId: string;
          sortKey: number;
        }>;
      },
      userId?: string,
    ) => Promise<Array<AssortmentFilter>>;
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
    create: (
      doc: AssortmentLink,
      options?: { skipInvalidation?: boolean },
      userId?: string,
    ) => Promise<AssortmentLink>;

    delete: (
      assortmentLinkId: string,
      options?: { skipInvalidation?: boolean },
      userId?: string,
    ) => Promise<Array<{ _id: _ID; parentAssortmentId: string }>>;
    deleteMany: (
      selector: Filter<AssortmentLink>,
      options?: { skipInvalidation?: boolean },
      userId?: string,
    ) => Promise<Array<{ _id: _ID; parentAssortmentId: string }>>;

    update: (assortmentLinkId: string, doc: AssortmentLink) => Promise<AssortmentLink>;

    updateManualOrder: (
      params: {
        sortKeys: Array<{
          assortmentLinkId: string;
          sortKey: number;
        }>;
      },
      userId?: string,
    ) => Promise<Array<AssortmentLink>>;
  };

  /*
   * Assortment products
   */

  products: {
    // Queries
    findAssortmentIds: (params: { productId: string }) => Promise<Array<string>>;

    findProduct: (
      params: { assortmentProductId: string },

      options?: { skipInvalidation?: boolean },
    ) => Promise<AssortmentProduct>;

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
      userId?: string,
    ) => Promise<AssortmentProduct>;

    delete: (
      assortmentProductId: string,
      options?: { skipInvalidation?: boolean },
      userId?: string,
    ) => Promise<Array<{ _id: _ID; assortmentId: string }>>;
    deleteMany: (
      selector: Filter<AssortmentProduct>,
      options?: { skipInvalidation?: boolean },
      userId?: string,
    ) => Promise<Array<{ _id: _ID; assortmentId: string }>>;

    update: (assortmentProductId: string, doc: AssortmentProduct) => Promise<AssortmentProduct>;

    updateManualOrder: (
      params: {
        sortKeys: Array<{
          assortmentProductId: string;
          sortKey: number;
        }>;
      },
      userId?: string,
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
    searchTexts: ({ searchText: string }) => Promise<Array<string>>;

    // Mutations
    updateTexts: (
      assortmentId: string,
      texts: Array<AssortmentText>,
      userId?: string,
    ) => Promise<Array<AssortmentText>>;

    upsertLocalizedText: (
      assortmentId: string,
      locale: string,
      text: AssortmentText,
      userId?: string,
    ) => Promise<AssortmentText>;

    makeSlug: (data: { slug?: string; title: string; assortmentId: string }) => Promise<string>;

    deleteMany: ({ assortmentId: string }, userId?: string) => Promise<number>;
  };
};

/*
 * Settings
 */

export interface AssortmentsSettingsOptions {
  zipTree?: (data: any) => any;
  setCachedProductIds?: (assortmentId: string, productIds: Array<string>) => Promise<number>;
  getCachedProductIds?: (assortmentId: string) => Promise<Array<string>>;
}
