import { log } from 'meteor/unchained:core-logger';
import { Bookmarks } from 'meteor/unchained:core-bookmarks';

export default function(root, { productId, bookmarked }, { userId }) {
  log('mutation bookmark', { productId, userId });

  const foundBookmark = Bookmarks.findBookmarks({ productId, userId }).pop();

  if (bookmarked) {
    if (foundBookmark) return foundBookmark;
    return Bookmarks.createBookmark({ productId, userId });
  }
  if (foundBookmark) Bookmarks.removeBookmark({ _id: foundBookmark._id });
  return null;
}
