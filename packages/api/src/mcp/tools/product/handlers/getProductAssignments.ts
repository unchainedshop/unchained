import type { Context } from '../../../../context.ts';
import { ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';
import normalizeProxyAssignments from '../../../utils/normalizeProxyAssignments.ts';

export default async function getProductAssignments(
  context: Context,
  params: Params<'GET_ASSIGNMENTS'>,
) {
  const { modules } = context;
  const { productId } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductType.CONFIGURABLE_PRODUCT) {
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductType.CONFIGURABLE_PRODUCT,
    });
  }

  const assignments = await Promise.all(
    (product?.proxy?.assignments || [])?.map(async (assignment) =>
      normalizeProxyAssignments(assignment, context),
    ),
  );
  return { assignments };
}
