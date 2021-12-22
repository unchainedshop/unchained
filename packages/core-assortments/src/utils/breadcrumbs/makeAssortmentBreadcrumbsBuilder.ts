import { Context } from '@unchainedshop/types/api';
import { Query } from '@unchainedshop/types/common';

import { walkUpFromAssortment, walkUpFromProduct } from './build-paths';

export const buildBreadcrumbs = async (options) => {
  const { productId } = options;
  if (productId) return walkUpFromProduct(options);
  return walkUpFromAssortment(options);
};

const resolveAssortmentLinksFromDatabase =
  (params: { selector: Query } = { selector: {} }, context: Context) =>
  async (assortmentId: string, childAssortmentId: string) => {
    const assortmentLinks = await context.modules.assortments.links.findLinks(
      { childAssortmentId: assortmentId, ...params.selector },
      {
        projection: { parentAssortmentId: 1 },
        sort: { sortKey: 1 },
      }
    );

    const parentIds = assortmentLinks.map((link) => link.parentAssortmentId);
    return {
      assortmentId,
      childAssortmentId,
      parentIds,
    };
  };

const resolveAssortmentProductsFromDatabase =
  (params: { selector: Query } = { selector: {} }, context: Context) =>
  async (productId: string) => {
    return await context.modules.assortments.products.findProducts(
      { productId, ...params.selector },
      {
        prodjection: { _id: true, assortmentId: true },
        sort: { sortKey: 1 },
      }
    );
  };

export const makeAssortmentBreadcrumbsBuilder = (context: Context) => {
  return async ({ productId, assortmentId }) =>
    await buildBreadcrumbs({
      resolveAssortmentProducts: resolveAssortmentProductsFromDatabase,
      resolveAssortmentLink: resolveAssortmentLinksFromDatabase,
      productId,
      assortmentId,
    });
};
