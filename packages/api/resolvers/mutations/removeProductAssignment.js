import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../errors';

export default function removeProductAssignment(
  root,
  { proxyId, vectors },
  { userId }
) {
  log(`mutation removeProductAssignment ${proxyId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });
  const product = Products.findOne({ _id: proxyId });
  if (!product) throw new ProductNotFoundError({ proxyId });
  if (product.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      productId: proxyId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });
  return product.removeAssignment({ vectors });
}
