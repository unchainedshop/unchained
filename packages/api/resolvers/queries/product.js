import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function product(root, { productId, slug }, { userId }) {
  log(`query product ${productId} ${slug}`, { userId });
  if (!productId === !slug) {
    throw new InvalidIdError({ productId, slug });
  }
  let product = null;

  if (productId) product = Products.findOne({ _id: productId });
  else product = Products.findOne({ slugs: slug });

  if (!product) throw new ProductNotFoundError({ productId });

  return product;
}
