import { Context } from '@unchainedshop/types/api';
import {
  Assortment as AssortmentType,
  AssortmentFilter,
  AssortmentLink,
  AssortmentPathLink,
  AssortmentProduct,
  AssortmentText,
} from '@unchainedshop/types/assortments';
import { AssortmentMedia } from '@unchainedshop/types/assortments.media';
import { Query } from '@unchainedshop/types/common';
import {
  SearchFilterQuery,
  SearchProducts,
} from '@unchainedshop/types/filters';

type HelperType<P, T> = (
  assortment: AssortmentType,
  params: P,
  context: Context
) => T;

export interface AssortmentHelperTypes {
  assortmentPaths: HelperType<
    never,
    Promise<Array<{ links: Array<AssortmentPathLink> }>>
  >;

  children: HelperType<
    { includeInactive: boolean },
    Promise<Array<AssortmentType>>
  >;
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

  search: HelperType<
    {
      queryString?: string;
      filterQuery?: SearchFilterQuery;
      includeInactive: boolean;
      ignoreChildAssortments: boolean;
    },
    Promise<SearchProducts>
  >;

  searchProducts: HelperType<
    {
      queryString?: string;
      filterQuery?: SearchFilterQuery;
      includeInactive: boolean;
      ignoreChildAssortments: boolean;
    },
    Promise<SearchProducts>
  >;

  texts: HelperType<{ forceLocale?: string }, Promise<AssortmentText>>;
}

export const Assortment: AssortmentHelperTypes = {
  async assortmentPaths(obj, _, { modules }) {
    return await modules.assortments.breadcrumbs({
      assortmentId: obj._id,
    });
  },

  children: async (obj, { includeInactive }, { modules }) => {
    return await modules.assortments.children({
      assortmentId: obj._id,
      includeInactive,
    });
  },

  childrenCount: async (
    assortment,
    { includeInactive = false },
    { modules }
  ) => {
    const assortmentChildrenIds = await modules.assortments.links.findLinks({
      parentAssortmentId: assortment._id,
    });
    const assortmentIds = assortmentChildrenIds.map(
      ({ childAssortmentId }) => childAssortmentId
    );

    const selector: Query = {
      _id: { $in: assortmentIds },
    };
    if (!includeInactive) {
      selector.isActive = true;
    }

    return await modules.assortments.count(selector);
  },

  filterAssignments: async (obj, _, { modules }) => {
    return await modules.assortments.filters.findFilters(
      {
        assortmentId: obj._id,
      },
      {
        sort: { sortKey: 1 },
      }
    );
  },

  linkedAssortments: async (obj, _, { modules }) => {
    return await modules.assortments.links.findLinks({
      assortmentId: obj._id,
    });
  },

  async media(obj, params, { modules }) {
    return await modules.assortments.media.findAssortmentMedias({
      assortmentId: obj._id,
      ...params,
    });
  },

  productAssignments: async (obj, _, { modules }) => {
    return await modules.assortments.products.findProducts(
      {
        assortmentId: obj._id,
      },
      {
        sort: { sortKey: 1 },
      }
    );
  },

  async texts(obj, { forceLocale }, { modules, localeContext }) {
    return await modules.assortments.texts.findLocalizedText({
      assortmentId: obj._id,
      locale: forceLocale || localeContext.normalized,
    });
  },

  search: async (obj, query, context) => {
    return await context.modules.filters.search.searchProducts(
      query,
      {},
      context
    );
  },
  searchProducts: async (obj, query, context) => {
    return await context.modules.filters.search.searchProducts(
      query,
      {},
      context
    );
  },
};
