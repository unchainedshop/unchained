import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongStatusError,
} from '../../errors';

export default function updateProductSupply(
  root,
  { supply, productId },
  { userId }
) {
  log(`mutation updateProductSupply ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const productObject = Products.updateProduct({ productId, supply });
  if (!productObject) throw new ProductNotFoundError({ productId });
  if (productObject?.type !== ProductTypes.SimpleProduct)
    throw new ProductWrongStatusError({
      received: productObject?.type,
      required: ProductTypes.SimpleProduct,
    });
  return productObject;
}
