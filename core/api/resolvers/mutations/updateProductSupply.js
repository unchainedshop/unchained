import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../errors';

export default function (root, { supply, productId }, { userId }) {
  log(`mutation updateProductSupply ${productId}`, { userId });
  const success = Products.update({ _id: productId }, {
    $set: {
      supply,
      updated: new Date(),
    },
  });
  if (!success) throw new ProductNotFoundError({ data: { productId } });
  const productObject = Products.findOne({ _id: productId });
  return productObject;
}
