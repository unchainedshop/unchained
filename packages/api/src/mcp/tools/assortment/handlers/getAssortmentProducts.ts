import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getAssortmentProducts(context: Context, params: Params<'GET_PRODUCTS'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const assortmentProducts = await modules.assortments.products.findAssortmentProducts(
    { assortmentId },
    { sort: { sortKey: 1 } },
  );

  const products = await Promise.all(
    assortmentProducts?.map(async ({ productId, ...rest }) => ({
      ...(await getNormalizedProductDetails(productId, context)),
      ...rest,
    })) || [],
  );
  return { products };
}
