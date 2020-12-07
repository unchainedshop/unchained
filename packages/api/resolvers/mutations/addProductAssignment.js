import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';

import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../errors';

export default function addProductAssignment(
  root,
  { proxyId, productId, vectors },
  { userId }
) {
  log(`mutation addProductAssignment ${proxyId} ${productId}`, { userId });

  if (!proxyId) throw new InvalidIdError({ proxyId });
  if (!productId) throw new InvalidIdError({ productId });
  const childProduct = Products.findOne({ _id: productId });
  if (!childProduct) throw new ProductNotFoundError({ productId });
  const proxyProduct = Products.findOne({ _id: proxyId });
  if (!proxyProduct) throw new ProductNotFoundError({ proxyId });
  if (proxyProduct.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      proxyId,
      received: proxyProduct.type,
      required: ProductTypes.ConfigurableProduct,
    });

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
