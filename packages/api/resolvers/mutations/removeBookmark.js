import { log } from 'meteor/unchained:core-logger';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';
import { BookmarkNotFoundError } from '../../errors';

export default function(root, { bookmarkId }, { userId }) {
  log('mutation removeBookmark', { bookmarkId, userId });
  if (!Bookmarks.findBookmarkById(bookmarkId)) {
    throw new BookmarkNotFoundError({ data: { bookmarkId } });
  }
  return Bookmarks.removeBookmark({ _id: bookmarkId });
}
