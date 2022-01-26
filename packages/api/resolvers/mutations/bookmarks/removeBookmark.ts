import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { BookmarkNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeBookmark(
  root: Root,
  { bookmarkId }: { bookmarkId: string },
  { userId, modules }: Context,
) {
  log('mutation removeBookmark', { bookmarkId, userId });
  if (!bookmarkId) throw new InvalidIdError({ bookmarkId });
  const bookmark = await modules.bookmarks.findById(bookmarkId);
  if (!bookmark) {
    throw new BookmarkNotFoundError({ bookmarkId });
  }
  await modules.bookmarks.delete(bookmarkId);
  return bookmark;
}
