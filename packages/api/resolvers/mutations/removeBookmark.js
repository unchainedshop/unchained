import { log } from 'meteor/unchained:core-logger';
import { BookmarkNotFoundError, InvalidIdError } from '../../errors';

export default async function removeBookmark(
  root,
  { bookmarkId },
  { userId, modules }
) {
  log('mutation removeBookmark', { bookmarkId, userId });
  if (!bookmarkId) throw new InvalidIdError({ bookmarkId });
  const bookmark = await modules.bookmarks.findBookmarkById(bookmarkId);
  if (!bookmark) {
    throw new BookmarkNotFoundError({ bookmarkId });
  }
  await modules.bookmarks.removeBookmarkById(bookmarkId);
  return bookmark;
}
