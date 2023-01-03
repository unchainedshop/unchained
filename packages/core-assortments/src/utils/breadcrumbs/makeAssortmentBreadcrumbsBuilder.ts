import { walkUpFromAssortment, walkUpFromProduct } from './build-paths.js';

export const buildBreadcrumbs = async (params) => {
  const { productId } = params;
  if (productId) return walkUpFromProduct(params);
  return walkUpFromAssortment(params);
};

export const makeAssortmentBreadcrumbsBuilder = ({
  resolveAssortmentLink,
  resolveAssortmentProducts,
}) => {
  return async (params: { assortmentId?: string; productId?: string }) =>
    buildBreadcrumbs({
      assortmentId: params.assortmentId,
      productId: params.productId,
      resolveAssortmentLink,
      resolveAssortmentProducts,
    });
};
