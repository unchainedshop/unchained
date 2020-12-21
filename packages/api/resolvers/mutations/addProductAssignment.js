import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';

import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../errors';

export default function addProductAssignment(
  root,
  { proxyId, productId, vectors },
  { userId }
) {
  log(`mutation addProductAssignment ${proxyId} ${productId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  const proxyProduct = Products.findOne({ _id: proxyId });
  if (!proxyProduct) throw new ProductNotFoundError({ proxyId });
  if (proxyProduct.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      proxyId,
      received: proxyProduct.type,
      required: ProductTypes.ConfigurableProduct,
    });

  return product.assignProxy({ proxyId, vectors });
}
