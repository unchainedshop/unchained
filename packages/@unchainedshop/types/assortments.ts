import { Context } from './api';
import { Filter, FindOptions, TimestampFields, _ID } from './common';
import { AssortmentMedia, AssortmentMediaModule } from './assortments.media';

export type Assortment = {
  _id?: _ID;
  authorId: string;
  isActive: Boolean;
  isBase: Boolean;
  isRoot: Boolean;
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

type AssortmentQuery = {
  slugs?: Array<string>;
  tags?: Array<string>;
  includeLeaves?: boolean;
  includeInactive?: boolean;
};

export type AssortmentsModule = {
  // Queries
  findAssortment: (params: {
    assortmentId?: string;
    slug?: string;
  }) => Promise<Assortment>;

  findAssortments: (
    params: AssortmentQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions
  ) => Promise<Array<Assortment>>;

  count: (query: AssortmentQuery) => Promise<number>;
  assortmentExists: (params: {
    assortmentId?: string;
    slug?: string;
  }) => Promise<boolean>;

  breadcrumbs: (params: { assortmentId: string, locale?: string }) => Promise<Array<{ links: Array<AssortmentPathLink> }>>;

  // Mutations
  create: (
    doc: Assortment & { title: string; locale: string },
    userId: string
  ) => Promise<string>;

  createBreadcrumbs: (userId?: string) => void;

  update: (
    assortmentId: string,
    doc: Assortment,
    userId: string
  ) => Promise<string>;

  delete: (
    assortmentId: string,
    options?: { skipInvalidation?: boolean },
    userId?: string
  ) => Promise<number>;

  invalidateCache: (
    params: { assortmentIds: Array<string> },
    userId?: string
  ) => void;

  setBase: (assortmentId: string, userId?: string) => Promise<void>;

  /*
   * Assortment media
   */
  media: AssortmentMediaModule;
  // {
  //   addMedia: ({ rawFile: any, authorId: string }, userId?: string) => Promise<string>
  //   findMediaTexts({ assortmentMediaId: string }) => Promise<Array<AssortmentText>>;
  // }

  /*
   * Assortment filters
   */
  filters: {
    // Queries
    findFilter: (
      params: { assortmentFilterId: string },

      options?: { skipInvalidation?: boolean }
    ) => Promise<AssortmentFilter>;
    findFilters: (
      params: {
        assortmentId: string;
      },
      options: FindOptions<AssortmentFilter>
    ) => Promise<Array<AssortmentFilter>>;

    // Mutations
    create: (
      doc: AssortmentFilter,
      userId?: string
    ) => Promise<AssortmentFilter>;

    delete: (
      assortmentFilterId: string,
      userId?: string
    ) => Promise<Array<{ _id: _ID }>>;
    deleteMany: (
      selector: Filter<AssortmentFilter>,
      userId?: string
    ) => Promise<Array<{ _id: _ID }>>;

    updateManualOrder: (
      params: {
        sortKeys: Array<{
          assortmentFilterId: string;
          sortKey: number;
        }>;
      },
      userId?: string
    ) => Promise<Array<AssortmentFilter>>;
  };

  /*
   * Assortment links
   */

  links: {
    // Queries
    findLink: (
      params: {
        assortmentLinkId?: string;
        parentAssortmentId?: string;
        childAssortmentId?: string;
      },
      options?: { skipInvalidation?: boolean }
    ) => Promise<AssortmentLink>;
    findLinks: (params: {
      parentAssortmentId?: string;
      childAssortmentId?: string;
    }) => Promise<Array<AssortmentLink>>;

    // Mutations
    create: (
      doc: AssortmentLink,
      options?: { skipInvalidation?: boolean },
      userId?: string
    ) => Promise<AssortmentLink>;

    delete: (
      assortmentLinkId: string,
      options?: { skipInvalidation?: boolean },
      userId?: string
    ) => Promise<Array<{ _id: _ID; parentAssortmentId: string }>>;
    deleteMany: (
      selector: Filter<AssortmentLink>,
      options?: { skipInvalidation?: boolean },
      userId?: string
    ) => Promise<Array<{ _id: _ID; parentAssortmentId: string }>>;

    updateManualOrder: (
      params: {
        sortKeys: Array<{
          assortmentLinkId: string;
          sortKey: number;
        }>;
      },
      userId?: string
    ) => Promise<Array<AssortmentLink>>;
  };

  /*
   * Assortment products
   */

  products: {
    // Queries
    findAssortmentIds: (params: {
      productId: string;
    }) => Promise<Array<string>>;
    findProduct: (
      params: { assortmentProductId: string },

      options?: { skipInvalidation?: boolean }
    ) => Promise<AssortmentProduct>;
    findProducts: (params: {
      productId: string;
      assortmentId: string;
    }) => Promise<Array<AssortmentProduct>>;
    findProductSiblings: (params: {
      productId: string;
      assortmentIds: Array<string>;
    }) => Promise<Array<string>>;

    // Mutations
    create: (
      doc: AssortmentProduct,
      options?: { skipInvalidation?: boolean },
      userId?: string
    ) => Promise<string>;

    delete: (
      assortmentProductId: string,
      options?: { skipInvalidation?: boolean },
      userId?: string
    ) => Promise<Array<{ _id: _ID; assortmentId: string }>>;
    deleteMany: (
      selector: Filter<AssortmentProduct>,
      options?: { skipInvalidation?: boolean },
      userId?: string
    ) => Promise<Array<{ _id: _ID; assortmentId: string }>>;

    updateManualOrder: (
      params: {
        sortKeys: Array<{
          assortmentProductId: string;
          sortKey: number;
        }>;
      },
      userId?: string
    ) => Promise<Array<AssortmentProduct>>;
  };

  /*
   * Assortment texts
   */

  texts: {
    // Queries
    findTexts: (params: {
      assortmentId: string;
    }) => Promise<Array<AssortmentText>>;

    findLocalizedText: (params: {
      assortmentId: string;
      locale?: string;
    }) => Promise<AssortmentText>;
    searchTexts: ({ searchText: string }) => Promise<Array<string>>;

    // Mutations
    updateTexts: (
      assortmentId: string,
      texts: Array<AssortmentText>,
      userId?: string
    ) => Promise<Array<AssortmentText>>;

    upsertLocalizedText: (
      assortmentId: string,
      locale: string,
      text: AssortmentText,
      userId?: string
    ) => Promise<AssortmentText>;

    makeSlug: (data: {
      slug?: string;
      title: string;
      assortmentId: string;
    }) => Promise<string>;

    deleteMany: (assortmentId: string, userId?: string) => Promise<number>;
  };
};

type HelperType<P, T> = (
  assortment: Assortment,
  params: P,
  context: Context
) => T;

interface AssortmentPathLink {
  assortmentId: string;
  assortmentSlug: string;
  assortmentTexts: AssortmentText;
  link: AssortmentLink;
}

export interface AssortmentHelperTypes {
  childrenCount: HelperType<{ includeInactive: boolean }, Promise<number>>;
  texts: HelperType<{ forceLocale?: string }, Promise<AssortmentText>>;
  
  assortmentPaths: HelperType<
    { forceLocale?: string },
    Promise<Array<{ links: Array<AssortmentPathLink> }>>
  >;

  media: HelperType<
    {
      limit: number;
      offset: number;
      tags?: Array<string>;
    },
    Promise<Array<AssortmentMedia>>
  >;
}

export interface AssortmentPathLinkHelperTypes {
  link: (params: { assortmentId: string, childAssortmentId: string }, _: never, context: Context) => Promise<AssortmentLink>;
 
  assortmentSlug: HelperType<
    { forceLocale?: string },
    Promise<string>
  >
  
  assortmentTexts: HelperType<
    { forceLocale?: string },
    Promise<AssortmentText>
  >
}