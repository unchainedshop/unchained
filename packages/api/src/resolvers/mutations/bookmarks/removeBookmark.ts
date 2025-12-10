import { log } from '@unchainedshop/logger';
import { BookmarkNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function removeBookmark(
  root: never,
  { bookmarkId }: { bookmarkId: string },
  { userId, modules }: Context,
) {
  log('mutation removeBookmark', { bookmarkId, userId });
  if (!bookmarkId) throw new InvalidIdError({ bookmarkId });
  const bookmark = await modules.bookmarks.findBookmarkById(bookmarkId);
  if (!bookmark) {
    throw new BookmarkNotFoundError({ bookmarkId });
  }
  await modules.bookmarks.delete(bookmarkId);
  return bookmark;
}
