import { Context } from '../../../../context.js';
import { ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function removeProductAssignment(
  context: Context,
  params: Params<'REMOVE_ASSIGNMENT'>,
) {
  const { modules } = context;
  const { proxyId, vectors } = params;

  const product = await modules.products.findProduct({ productId: proxyId });
  if (!product) throw new ProductNotFoundError({ productId: proxyId });

  if (product.type !== ProductType.CONFIGURABLE_PRODUCT) {
    throw new ProductWrongTypeError({
      productId: proxyId,
      received: product.type,
      required: ProductType.CONFIGURABLE_PRODUCT,
    });
  }

  await modules.products.assignments.removeAssignment(proxyId, { vectors: vectors as any });
  return { success: true };
}
