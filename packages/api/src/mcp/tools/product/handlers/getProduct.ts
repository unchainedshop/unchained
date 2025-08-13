import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getProduct(context: Context, params: Params<'GET'>) {
  const { modules } = context;
  const { productId, slug, sku } = params;

  let query: any = {};
  if (productId) query = { productId };
  else if (slug) query = { slug };
  else if (sku) query = { sku };
  else throw new Error('Either productId, slug, or sku must be provided');

  const foundProduct = await modules.products.findProduct(query);
  if (!foundProduct) throw new ProductNotFoundError(query);

  const product = await getNormalizedProductDetails(foundProduct._id, context);
  return { product };
}
