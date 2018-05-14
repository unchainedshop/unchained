import { log } from 'meteor/unchained:core-logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import { ProductNotFoundError, ProductWrongStatusError } from '../errors';

export default function (root, { productId }, { userId }) {
  log(`mutation unpublishProduct ${productId}`, { userId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ data: { productId } });
  switch (product.status) {
    case ProductStatus.ACTIVE:
      Products.update({ _id: productId }, {
        $set: {
          status: ProductStatus.DRAFT,
          updated: new Date(),
          published: null,
        },
      });
      break;
    default:
      throw new ProductWrongStatusError({ data: { status: product.status } });
  }

  return Products.findOne({ _id: productId });
}
