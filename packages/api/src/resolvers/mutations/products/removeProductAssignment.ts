import { Context, Root } from '@unchainedshop/types/api';
import { ProductConfiguration } from '@unchainedshop/types/products';
import { ProductTypes } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError, ProductWrongTypeError } from '../../../errors';

export default async function removeProductAssignment(
  root: Root,
  params: { proxyId: string; vectors: Array<ProductConfiguration> },
  { modules, userId }: Context,
) {
  const { proxyId, vectors } = params;
  log(`mutation removeProductAssignment ${proxyId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });

  const product = await modules.products.findProduct({ productId: proxyId });
  if (!product) throw new ProductNotFoundError({ proxyId });

  if (product.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      productId: proxyId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });

  await modules.products.assignments.removeAssignment(proxyId, { vectors }, userId);

  return modules.products.findProduct({ productId: proxyId });
}
