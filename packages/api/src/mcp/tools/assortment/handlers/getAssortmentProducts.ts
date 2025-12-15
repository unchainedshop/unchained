import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getAssortmentProducts(context: Context, params: Params<'GET_PRODUCTS'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const assortmentProducts = await modules.assortments.products.findAssortmentProducts({
    assortmentId,
  });

  const products = await Promise.all(
    assortmentProducts?.map(async ({ productId, ...rest }) => ({
      ...(await getNormalizedProductDetails(productId, context)),
      ...rest,
    })) || [],
  );
  return { assortment, products };
}
