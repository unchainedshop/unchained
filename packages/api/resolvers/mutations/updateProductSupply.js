import { log } from 'meteor/unchained:logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';

import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../errors';

export default function updateProductSupply(
  root,
  { supply, productId },
  { userId }
) {
  log(`mutation updateProductSupply ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (product?.type !== ProductTypes.SimpleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product?.type,
      required: ProductTypes.SimpleProduct,
    });
  Products.updateProduct({ productId, supply });
  return Products.findProduct({ productId });
}
