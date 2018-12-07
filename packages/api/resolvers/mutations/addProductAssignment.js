import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';

export default function (root, { proxyId, productId, vectors }, { userId }) {
  log(`mutation addProductAssignment ${proxyId} ${productId}`, { userId });
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
