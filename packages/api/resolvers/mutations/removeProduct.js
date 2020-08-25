import { log } from 'meteor/unchained:core-logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function removeProduct(root, { productId }, { userId }) {
  log(`mutation removeProduct ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  switch (product.status) {
    case ProductStatus.DRAFT:
      Products.update(
        { _id: productId },
        {
          $set: {
            status: ProductStatus.DELETED,
            updated: new Date(),
          },
        },
      );
      break;
    default:
      throw new ProductWrongStatusError({ status: product.status });
  }
  return Products.findOne({ _id: productId });
}
