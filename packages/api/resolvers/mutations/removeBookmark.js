import { log } from 'meteor/unchained:core-logger';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';
import { BookmarkNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { bookmarkId }, { userId }) {
  log('mutation removeBookmark', { bookmarkId, userId });
  if (!bookmarkId) throw new InvalidIdError({ bookmarkId });
  if (!Bookmarks.findBookmarkById(bookmarkId)) {
    throw new BookmarkNotFoundError({ bookmarkId });
  }
  return Bookmarks.removeBookmark({ _id: bookmarkId });
}
