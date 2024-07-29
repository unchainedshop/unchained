import { Context } from '../../../types.js';
import {
  Assortment as AssortmentType,
  AssortmentFilter,
  AssortmentLink,
  AssortmentPathLink,
  AssortmentProduct,
  AssortmentText,
} from '@unchainedshop/core-assortments';
import { AssortmentMediaType } from '@unchainedshop/core-assortments';
import { SearchFilterQuery, SearchProducts } from '@unchainedshop/core-filters';

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
    Promise<Array<AssortmentMediaType>>
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

  childrenCount: async (assortment, { includeInactive = false }, { modules, loaders }) => {
    const assortmentChildLinks = await loaders.assortmentLinksLoader.load({
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

  async linkedAssortments(assortment, _, { loaders }) {
    return loaders.assortmentLinksLoader.load({
      assortmentId: assortment._id,
    });
  },

  // TODO: Use a loader!
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
      locale: forceLocale || localeContext.baseName,
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
