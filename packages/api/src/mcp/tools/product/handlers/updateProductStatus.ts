import type { Context } from '../../../../context.ts';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../../errors.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function updateProductStatus(context: Context, params: Params<'UPDATE_STATUS'>) {
  const { modules } = context;
  const { productId, statusAction } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  let success: boolean;
  if (statusAction === 'PUBLISH') {
    success = await modules.products.publish(product);
  } else {
    success = await modules.products.unpublish(product);
  }

  if (!success) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  return { product: await getNormalizedProductDetails(productId, context) };
}
