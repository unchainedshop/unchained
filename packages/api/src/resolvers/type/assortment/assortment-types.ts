import { Context } from '@unchainedshop/types/api.js';
import {
  Assortment as AssortmentType,
  AssortmentFilter,
  AssortmentLink,
  AssortmentPathLink,
  AssortmentProduct,
  AssortmentText,
} from '@unchainedshop/types/assortments.js';
import { AssortmentMedia } from '@unchainedshop/types/assortments.media.js';
import { SearchFilterQuery, SearchProducts } from '@unchainedshop/types/filters.js';

type HelperType<P, T> = (assortment: AssortmentType, params: P, context: Context) => T;

export interface AssortmentHelperTypes {
  assortmentPaths: HelperType<never, Promise<Array<{ links: Array<AssortmentPathLink> }>>>;

  children: HelperType<{ includeInactive: boolean }, Promise<Array<AssortmentType>>>;
  childrenCount: HelperType<{ includeInactive: boolean }, Promise<number>>;

  filterAssignments: HelperType<never, Promise<Array<AssortmentFilter>>>;
  linkedAssortments: HelperType<never, Promise<Array<AssortmentLink>>>;

  media: HelperType<
    {
      limit: number;
      offset: number;
      tags?: Array<string>;
    },
    Promise<Array<AssortmentMedia>>
  >;

  productAssignments: HelperType<never, Promise<Array<AssortmentProduct>>>;

  searchProducts: HelperType<
    {
      queryString?: string;
      filterQuery?: SearchFilterQuery;
      includeInactive: boolean;
      ignoreChildAssortments: boolean;
      orderBy?: string;
    },
    Promise<SearchProducts>
  >;

  texts: HelperType<{ forceLocale?: string }, Promise<AssortmentText>>;
}

export const Assortment: AssortmentHelperTypes = {
  assortmentPaths: (obj, _, { modules }) => {
    return modules.assortments.breadcrumbs({
      assortmentId: obj._id,
    });
  },

  children: async (obj, { includeInactive }, { modules }) => {
    return modules.assortments.children({
      assortmentId: obj._id,
      includeInactive,
    });
  },

  childrenCount: async (assortment, { includeInactive = false }, { modules }) => {
    // TODO: Loader
    const assortmentChildLinks = await modules.assortments.links.findLinks({
      parentAssortmentId: assortment._id,
    });
    const assortmentIds = assortmentChildLinks.map(({ childAssortmentId }) => childAssortmentId);

    return modules.assortments.count({
      assortmentIds,
      includeInactive,
      includeLeaves: true,
    });
  },

  filterAssignments: async (obj, _, { modules }) => {
    // TODO: Loader & move default sort to module
    return modules.assortments.filters.findFilters(
      {
        assortmentId: obj._id,
      },
      {
        sort: { sortKey: 1 },
      },
    );
  },

  async linkedAssortments(obj, _, { modules }) {
    // TODO: Loader
    return modules.assortments.links.findLinks({
      assortmentId: obj._id,
    });
  },

  async media(obj, params, { modules }) {
    return modules.assortments.media.findAssortmentMedias({
      assortmentId: obj._id,
      ...params,
    });
  },

  async productAssignments(obj, _, { modules }) {
    // TODO: Loader & move default sort to core module
    return modules.assortments.products.findProducts(
      {
        assortmentId: obj._id,
      },
      {
        sort: { sortKey: 1 },
      },
    );
  },

  async texts(obj, { forceLocale }, requestContext) {
    const { localeContext, loaders } = requestContext;
    return loaders.assortmentTextLoader.load({
      assortmentId: obj._id,
      locale: forceLocale || localeContext.normalized,
    });
  },

  searchProducts: async (obj, query, context) => {
    const productIds = await context.modules.assortments.findProductIds({
      assortmentId: obj._id,
      ignoreChildAssortments: query.ignoreChildAssortments,
    });

    const filterIds = await context.modules.assortments.filters.findFilterIds({
      assortmentId: obj._id,
    });
    return context.modules.filters.search.searchProducts(
      { ...query, productIds, filterIds },
      {},
      context,
    );
  },
};
