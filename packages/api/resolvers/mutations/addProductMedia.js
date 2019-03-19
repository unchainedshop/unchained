import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';

export default function(root, { media, productId }, { userId }) {
  log(`mutation addProductMedia ${productId}`, { userId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ data: { productId } });
  const productMedia = product.addMedia({ rawFile: media, userId });
  return productMedia;
}
