import { walkUpFromAssortment, walkUpFromProduct } from './build-paths';

export const buildBreadcrumbs = async options => {
  const { productId } = options;
  if (productId) return walkUpFromProduct(options);
  return walkUpFromAssortment(options);
};

export const makeBreadcrumbsBuilder = ({
  resolveAssortmentProducts,
  resolveAssortmentLink
}) => async ({ productId, assortmentId }) =>
  buildBreadcrumbs({
    resolveAssortmentProducts,
    resolveAssortmentLink,
    productId,
    assortmentId
  });
