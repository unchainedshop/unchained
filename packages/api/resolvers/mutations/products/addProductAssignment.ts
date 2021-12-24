import { log } from 'meteor/unchained:logger';
import { ProductTypes } from 'meteor/unchained:core-products';

import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../../errors';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductConfiguration } from '@unchainedshop/types/products';

export default async function addProductAssignment(
  root: Root,
  params: {
    proxyId: string;
    productId: string;
    vectors: Array<ProductConfiguration>;
  },
  { modules, userId }: Context
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

  await modules.products.assignments.addProxyAssignment(
    productId,
    {
      proxyId,
      vectors,
    },
    userId
  );

  return await modules.products.findProduct({ productId: proxyId });
}
