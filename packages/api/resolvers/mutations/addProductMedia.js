import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function (root, { media, productId }, { userId }) {
  log(`mutation addProductMedia ${productId}`, { userId });
  if (!productId) throw new Error('Invalid product ID provided');
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  const productMedia = product.addMedia({ rawFile: media, userId });
  return productMedia;
}
