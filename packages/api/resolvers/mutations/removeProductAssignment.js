import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTypes } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../errors';

export default function removeProductAssignment(
  root,
  { proxyId, vectors },
  { userId }
) {
  log(`mutation removeProductAssignment ${proxyId}`, { userId });
  if (!proxyId) throw new InvalidIdError({ proxyId });
  const product = Products.findOne({ _id: proxyId });
  if (!product) throw new ProductNotFoundError({ proxyId });
  if (product.type !== ProductTypes.ConfigurableProduct)
    throw new ProductWrongTypeError({
      productId: proxyId,
      recieved: product.type,
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
    $pull: {
      'proxy.assignments': {
        vector,
      },
    },
  };
  Products.update({ _id: proxyId }, modifier, { multi: true });
  return Products.findOne({ _id: proxyId });
}
