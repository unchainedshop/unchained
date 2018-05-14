import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../errors';

export default function (root, { warehousing, productId }, { userId }) {
  log(`mutation updateProductWarehousing ${productId}`, { userId });
  const success = Products.update({ _id: productId }, {
    $set: {
      warehousing,
      updated: new Date(),
    },
  });
  if (!success) throw new ProductNotFoundError({ data: { productId } });
  const productObject = Products.findOne({ _id: productId });
  return productObject;
}
