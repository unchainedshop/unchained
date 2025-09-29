import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { Params } from '../schemas.js';
import normalizeProxyAssignments from '../../../utils/normalizeProxyAssignments.js';

export default async function getProductAssignments(
  context: Context,
  params: Params<'GET_ASSIGNMENTS'>,
) {
  const { modules } = context;
  const { productId } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductTypes.ConfigurableProduct) {
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });
  }

  const assignments = await Promise.all(
    (product?.proxy?.assignments || [])?.map(async (assignment) =>
      normalizeProxyAssignments(assignment, context),
    ),
  );
  return { assignments };
}
