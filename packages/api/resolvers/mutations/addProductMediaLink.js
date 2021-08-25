import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';

export default function addProductMediaLink(
  root,
  { mediaUploadTicketId, productId },
  { userId }
) {
  log(`mutation addProductMediaLink `, { userId });
  const product = Products.findProduct({ productId });
  return product.addMediaLink({
    mediaId: mediaUploadTicketId,
    authorId: userId,
  });
}
