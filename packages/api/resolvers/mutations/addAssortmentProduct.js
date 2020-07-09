import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { Products } from 'meteor/unchained:core-products';
import { AssortmentNotFoundError, ProductNotFoundError } from '../../errors';

export default function (root, { assortmentId, productId, tags }, { userId }) {
  log(`mutation addAssortmentProduct ${assortmentId} -> ${productId}`, {
    userId,
  });
  if (!assortmentId || !productId) {
    throw new Error(
      'Invalid value provided for either assortmentId or productId',
    );
  }
  const assortment = Assortments.findOne({ _id: assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  return assortment.addProduct({ productId, tags });
}
