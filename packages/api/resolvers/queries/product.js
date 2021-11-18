import { log } from 'unchained-logger';
import { Products } from 'meteor/unchained:core-products';
import { InvalidIdError } from '../../errors';

export default function product(root, { productId, slug }, { userId }) {
  log(`query product ${productId} ${slug}`, { userId });

  if (!productId === !slug) throw new InvalidIdError({ productId, slug });
  return Products.findProduct({ productId, slug });
}
