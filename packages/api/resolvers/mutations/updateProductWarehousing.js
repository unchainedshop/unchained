import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function updateProductWarehousing(
  root,
  { warehousing, productId },
  { userId },
) {
  log(`mutation updateProductWarehousing ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const productObject = Products.updateProduct({ productId, warehousing });
  if (!productObject) throw new ProductNotFoundError({ productId });
  return productObject;
}
