import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { proxyId, productId, vectors }, { userId }) {
  log(`mutation addProductAssignment ${proxyId} ${productId}`, { userId });

  const proxy = Products.findOne({ _id: proxyId });
  const product = Products.findOne({ _id: productId });

  if (!product) throw new ProductNotFoundError({ productId });
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
