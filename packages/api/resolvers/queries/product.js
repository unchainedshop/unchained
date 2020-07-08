import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { productId, slug }, { userId }) {
  log(`query product ${productId} ${slug}`, { userId });
  if (!productId === !slug) {
    throw new Error('please choose either a productId or a slug');
  }
  let product = null;

  if (productId) {
    product = Products.findOne({ _id: productId });
  } else {
    product = Products.findOne({ slugs: slug });
  }

  if (!product) throw new ProductNotFoundError({ productId });

  return product;
}
