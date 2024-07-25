import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';

import { Context } from '../../../types.js';
import { ProductConfiguration } from '@unchainedshop/types/products.js';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.js';

export default async function addProductAssignment(
  root: never,
  params: {
    proxyId: string;
    productId: string;
    vectors: Array<ProductConfiguration>;
  },
  { modules, userId }: Context,
) {
  const { proxyId, productId, vectors } = params;

  log(`mutation addProductAssignment ${proxyId} ${productId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });
  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const proxyProduct = await modules.products.findProduct({
    productId: proxyId,
  });
  if (!proxyProduct) throw new ProductNotFoundError({ proxyId });

  if (proxyProduct.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      proxyId,
      received: proxyProduct.type,
      required: ProductTypes.ConfigurableProduct,
    });

  await modules.products.assignments.addProxyAssignment(productId, {
    proxyId,
    vectors,
  });

  return modules.products.findProduct({ productId: proxyId });
}
