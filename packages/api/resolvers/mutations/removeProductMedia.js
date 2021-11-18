import { log } from 'unchained-logger';
import { ProductMedia } from 'meteor/unchained:core-products';
import { ProductMediaNotFoundError, InvalidIdError } from '../../errors';

export default async function removeProductMedia(
  root,
  { productMediaId },
  { userId }
) {
  log(`mutation removeProductMedia ${productMediaId}`, { userId });
  if (!productMediaId) throw new InvalidIdError({ productMediaId });
  const productMedia = ProductMedia.findProductMedia({ productMediaId });
  if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });
  await ProductMedia.removeProductMedia({ productMediaId });
  return productMedia;
}
