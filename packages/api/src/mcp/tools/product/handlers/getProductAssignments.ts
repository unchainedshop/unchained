import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getProductAssignments(
  context: Context,
  params: Params<'GET_ASSIGNMENTS'>,
) {
  const { modules } = context;
  const { productId, includeInactive = false } = params;

  const product = await getNormalizedProductDetails(productId, context);
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductTypes.ConfigurableProduct) {
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });
  }

  const assignments = await modules.products.proxyAssignments(product, { includeInactive });
  return { assignments };
}
