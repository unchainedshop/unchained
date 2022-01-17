import { walkUpFromAssortment, walkUpFromProduct } from './build-paths';

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
    await buildBreadcrumbs({
      assortmentId: params.assortmentId,
      productId: params.productId,
      resolveAssortmentLink,
      resolveAssortmentProducts,
    });
};
