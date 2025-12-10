import { walkUpFromAssortment, walkUpFromProduct } from './build-paths.ts';

export const walk = async (params) => {
  const { productId } = params;
  if (productId) return walkUpFromProduct(params);
  return walkUpFromAssortment(params);
};

export const makeAssortmentBreadcrumbsBuilder = ({
  resolveAssortmentLinks,
  resolveAssortmentProducts,
}) => {
  return async (params: { assortmentId?: string; productId?: string }) =>
    walk({
      assortmentId: params.assortmentId,
      productId: params.productId,
      resolveAssortmentLinks,
      resolveAssortmentProducts,
    });
};
