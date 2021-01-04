import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function updateProduct(
  root,
  { product, productId },
  { userId }
) {
  log(`mutation updateProduct ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });
  Products.updateProduct({ productId, ...product });
  return Products.findProduct({ productId });
}
