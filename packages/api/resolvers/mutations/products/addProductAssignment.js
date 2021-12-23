import { log } from 'meteor/unchained:logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';

import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../../errors';

export default function addProductAssignment(
  root,
  { proxyId, productId, vectors },
  { userId }
) {
  log(`mutation addProductAssignment ${proxyId} ${productId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });
  if (!productId) throw new InvalidIdError({ productId });
  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });
  const proxyProduct = Products.findProduct({ productId: proxyId });
  if (!proxyProduct) throw new ProductNotFoundError({ proxyId });
  if (proxyProduct.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      proxyId,
      received: proxyProduct.type,
      required: ProductTypes.ConfigurableProduct,
    });
  Products.addProxyAssignment({ productId, proxyId, vectors });
  return Products.findProduct({ productId: proxyId });
}
