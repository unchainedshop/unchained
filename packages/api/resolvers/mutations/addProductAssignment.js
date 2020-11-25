import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';

import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongStatusError,
} from '../../errors';

export default function addProductAssignment(
  root,
  { proxyId, productId, vectors },
  { userId }
) {
  log(`mutation addProductAssignment ${proxyId} ${productId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });
  if (!productId) throw new InvalidIdError({ productId });

  const product = Products.findOne({ _id: productId });

  if (!product) throw new ProductNotFoundError({ productId });
  if (product.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongStatusError({
      productId,
      recieved: product.type,
      required: ProductTypes.ConfigurableProduct,
    });

  const proxy = Products.findOne({ _id: proxyId });

  if (!proxy) throw new ProductNotFoundError({ proxyId });

  const vector = {};
  vectors.forEach(({ key, value }) => {
    vector[key] = value;
  });
  const modifier = {
    $set: {
      updated: new Date(),
    },
    $push: {
      'proxy.assignments': {
        vector,
        productId,
      },
    },
  };
  Products.update({ _id: proxyId }, modifier);
  return Products.findOne({ _id: proxyId });
}
