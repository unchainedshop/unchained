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
  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });
  if (Bookmarks.bookmarkExists({ productId, userId: foreignUserId }))
    throw new BookmarkAlreadyExistsError();

  return Bookmarks.createBookmark({ userId: foreignUserId, productId });
}
