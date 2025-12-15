import type { Context } from '../../../context.ts';
import type { Assortment } from '@unchainedshop/core-assortments';
import type { SearchFilterQuery } from '@unchainedshop/core-filters';

export const AssortmentTypes = {
  assortmentPaths(obj: Assortment, _, { modules, loaders }: Context) {
    return modules.assortments.breadcrumbs(
      {
        assortmentId: obj._id,
      },
      {
        resolveAssortmentProducts: async (productId) =>
          loaders.assortmentProductsLoader.load({
            productId,
          }),
        resolveAssortmentLinks: async (childAssortmentId) =>
          loaders.assortmentLinksLoader.load({
            childAssortmentId,
          }),
      },
    );
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

  async filterAssignments(obj: Assortment, _, { modules }: Context) {
    return modules.assortments.filters.findFilters({
      assortmentId: obj._id,
    });
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
      tags?: string[];
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
    return modules.assortments.products.findAssortmentProducts({
      assortmentId: obj._id,
    });
  },

  async texts(obj: Assortment, { forceLocale }: { forceLocale?: string }, requestContext: Context) {
    const { locale, loaders } = requestContext;
    return loaders.assortmentTextLoader.load({
      assortmentId: obj._id,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
  },

  searchProducts: async (
    assortment: Assortment,
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
      assortment,
      ignoreChildAssortments: query.ignoreChildAssortments,
    });

    const filterIds = await modules.assortments.filters.findFilterIds({
      assortmentId: assortment._id,
    });
    return services.filters.searchProducts(
      { ...query, productIds, filterIds },
      {
        locale: requestContext.locale,
        userId: requestContext.userId,
      },
    );
  },
};
