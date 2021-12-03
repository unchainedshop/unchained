import { log } from 'meteor/unchained:logger';
import { ProductMedia } from 'meteor/unchained:core-products';
import { ProductMediaNotFoundError, InvalidIdError } from '../../errors';

export default function updateProductMediaTexts(
  root,
  { texts, productMediaId },
  { userId }
) {
  log(`mutation updateProductMediaTexts ${productMediaId}`, { userId });
  if (!productMediaId) throw new InvalidIdError({ productMediaId });
  const productMedia = ProductMedia.findProductMedia({ productMediaId });
  if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });
  return productMedia.updateTexts({ texts, userId });
}
