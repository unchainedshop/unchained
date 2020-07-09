import { log } from 'meteor/unchained:core-logger';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';
import { BookmarkAlreadyExistsError } from '../../errors';

export default function (
  root,
  { productId, userId: foreignUserId },
  { userId },
) {
  log(`mutation createBookmark for ${foreignUserId}`, { productId, userId });
  if (!productId) throw new Error('Invalid product ID provided');
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
