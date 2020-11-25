import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongStatusError,
} from '../../errors';

export default function updateProductWarehousing(
  root,
  { warehousing, productId },
  { userId }
) {
  log(`mutation updateProductWarehousing ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const productObject = Products.updateProduct({ productId, warehousing });
  if (!productObject) throw new ProductNotFoundError({ productId });
  if (productObject.type !== ProductTypes.SimpleProduct)
    throw new ProductWrongStatusError({
      productId,
      recieved: productObject.type,
      required: ProductTypes.SimpleProduct,
    });
  return productObject;
}
