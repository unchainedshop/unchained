import { log } from 'meteor/unchained:core-logger';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';
import { BookmarkNotFoundError, InvalidIdError } from '../../errors';

export default function removeBookmark(root, { bookmarkId }, { userId }) {
  log('mutation removeBookmark', { bookmarkId, userId });
  if (!bookmarkId) throw new InvalidIdError({ bookmarkId });
  const bookmark = Bookmarks.findBookmark({ bookmarkId });
  if (!bookmark) {
    throw new BookmarkNotFoundError({ bookmarkId });
  }
  Bookmarks.removeBookmark({ bookmarkId });
  return bookmark;
}
