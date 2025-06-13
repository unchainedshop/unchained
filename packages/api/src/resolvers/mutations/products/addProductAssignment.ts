import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';

import { Context } from '../../../context.js';
import { ProductConfiguration } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError, ProductVariationInfinityLoop } from '../../../errors.js';

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

  if (productId === proxyId) throw new ProductVariationInfinityLoop({ productId });

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
