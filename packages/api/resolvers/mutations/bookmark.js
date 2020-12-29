import { log } from 'meteor/unchained:core-logger';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';
import { Products } from 'meteor/unchained:core-products';
import { InvalidIdError, ProductNotFoundError } from '../../errors';

export default function bookmark(root, { productId, bookmarked }, { userId }) {
  log('mutation bookmark', { productId, userId });

  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const foundBookmark = Bookmarks.findBookmarks({ productId, userId }).pop();

  if (bookmarked) {
    if (foundBookmark) return foundBookmark;
    return Bookmarks.createBookmark({ productId, userId });
  }
  if (foundBookmark) Bookmarks.removeBookmark({ _id: foundBookmark._id });
  return foundBookmark;
}
