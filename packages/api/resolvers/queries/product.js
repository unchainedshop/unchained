import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function product(root, { productId, slug }, { userId }) {
  log(`query product ${productId} ${slug}`, { userId });

  if (!productId === !slug) throw new InvalidIdError({ productId, slug });

  const foundProduct = productId
    ? Products.findOne({ _id: productId })
    : Products.findOne({ slugs: slug });

  if (!foundProduct) throw new ProductNotFoundError({ productId });

  return foundProduct;
}
