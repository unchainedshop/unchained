import { log } from 'meteor/unchained:core-logger';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';
import { Products } from 'meteor/unchained:core-products';
import {
  BookmarkAlreadyExistsError,
  InvalidIdError,
  ProductNotFoundError,
} from '../../errors';

export default function createBookmark(
  root,
  { productId, userId: foreignUserId },
  { userId }
) {
  log(`mutation createBookmark for ${foreignUserId}`, { productId, userId });
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  const foundBookmark = Bookmarks.findBookmarks({
    productId,
    userId: foreignUserId,
  }).pop();
  if (foundBookmark) {
    throw new BookmarkAlreadyExistsError({
      bookmarkId: foundBookmark._id,
    });
  }
  return Bookmarks.createBookmark({ userId: foreignUserId, productId });
}
