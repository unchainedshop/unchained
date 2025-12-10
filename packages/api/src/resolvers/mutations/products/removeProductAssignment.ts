import { Context } from '../../../context.js';
import { ProductConfiguration, ProductType } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';

export default async function removeProductAssignment(
  root: never,
  params: { proxyId: string; vectors: ProductConfiguration[] },
  { modules, userId }: Context,
) {
  const { proxyId, vectors } = params;
  log(`mutation removeProductAssignment ${proxyId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });

  const product = await modules.products.findProduct({ productId: proxyId });
  if (!product) throw new ProductNotFoundError({ proxyId });

  if (product.type !== ProductType.CONFIGURABLE_PRODUCT)
    throw new ProductWrongTypeError({
      productId: proxyId,
      received: product.type,
      required: ProductType.CONFIGURABLE_PRODUCT,
    });

  await modules.products.assignments.removeAssignment(proxyId, { vectors });

  return modules.products.findProduct({ productId: proxyId });
}
