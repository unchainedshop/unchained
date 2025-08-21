import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getSiblings(context: Context, params: Params<'GET_SIBLINGS'>) {
  const { modules } = context;
  const { productId, includeInactive = false } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const siblings = await modules.products.proxyProducts(product, [], {
    includeInactive,
  });

  return {
    products: await Promise.all(siblings.map(({ _id }) => getNormalizedProductDetails(_id, context))),
  };
}
