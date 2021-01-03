import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function updateProductCommerce(
  root,
  { commerce, productId },
  { userId }
) {
  log(`mutation updateProductCommerce ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });
  Products.updateProduct({ productId, commerce });
  return Products.findProduct({ productId });
}
