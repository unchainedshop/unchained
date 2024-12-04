import { Context } from '../../../context.js';
import { Assortment } from '@unchainedshop/core-assortments';
import { SearchFilterQuery } from '@unchainedshop/core-filters';

export const AssortmentTypes = {
  assortmentPaths: (obj: Assortment, _, { modules }: Context) => {
    return modules.assortments.breadcrumbs({
      assortmentId: obj._id,
    });
  },

  children: async (
    obj: Assortment,
    { includeInactive }: { includeInactive: boolean },
    { modules }: Context,
  ) => {
    return modules.assortments.children({
      assortmentId: obj._id,
      includeInactive,
    });
  },

  childrenCount: async (
    assortment: Assortment,
    { includeInactive = false }: { includeInactive: boolean },
    { modules, loaders }: Context,
  ) => {
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

  filterAssignments: async (obj: Assortment, _, { modules }: Context) => {
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

  async linkedAssortments(assortment: Assortment, _, { loaders }: Context) {
    return loaders.assortmentLinksLoader.load({
      assortmentId: assortment._id,
    });
  },

  async media(
    obj: Assortment,
    params: {
      limit: number;
      offset: number;
      tags?: Array<string>;
    },
    { modules, loaders }: Context,
  ) {
    if (params.offset || params.tags) {
      return modules.assortments.media.findAssortmentMedias({
        assortmentId: obj._id,
        ...params,
      });
    }
    return (await loaders.assortmentMediasLoader.load({ assortmentId: obj._id })).slice(
      params.offset,
      params.offset + params.limit,
    );
  },

  async productAssignments(obj: Assortment, _, { modules }: Context) {
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

  async texts(obj: Assortment, { forceLocale }: { forceLocale?: string }, requestContext: Context) {
    const { localeContext, loaders } = requestContext;
    return loaders.assortmentTextLoader.load({
      assortmentId: obj._id,
      locale: forceLocale || localeContext.baseName,
    });
  },

  searchProducts: async (
    obj: Assortment,
    query: {
      queryString?: string;
      filterQuery?: SearchFilterQuery;
      includeInactive: boolean;
      ignoreChildAssortments: boolean;
      orderBy?: string;
    },
    requestContext: Context,
  ) => {
    const { modules, services } = requestContext;
    const productIds = await modules.assortments.findProductIds({
      assortmentId: obj._id,
      ignoreChildAssortments: query.ignoreChildAssortments,
    });

    const filterIds = await modules.assortments.filters.findFilterIds({
      assortmentId: obj._id,
    });
    return services.filters.searchProducts({ ...query, productIds, filterIds }, {}, requestContext);
  },
};
