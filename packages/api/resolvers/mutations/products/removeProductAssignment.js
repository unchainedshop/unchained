import { log } from 'meteor/unchained:logger';
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
  const product = Products.findProduct({ productId: proxyId });
  if (!product) throw new ProductNotFoundError({ proxyId });
  if (product.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      productId: proxyId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });
  Products.removeAssignment({ productId: proxyId, vectors });
  return Products.findProduct({ productId: proxyId });
}
