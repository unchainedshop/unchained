import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { proxyId, vectors }, { userId }) {
  log(`mutation removeProductAssignment ${proxyId}`, { userId });

  const product = Products.findOne({ _id: proxyId });
  if (!product) throw new ProductNotFoundError({ proxyId });

  const vector = {};
  vectors.forEach(({ key, value }) => {
    vector[key] = value;
  });
  const modifier = {
    $set: {
      updated: new Date(),
    },
    $pull: {
      'proxy.assignments': {
        vector,
      },
    },
  };
  Products.update({ _id: proxyId }, modifier, { multi: true });
  return Products.findOne({ _id: proxyId });
}
