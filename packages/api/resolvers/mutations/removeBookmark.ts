import { Context, Root } from '@unchainedshop/types/api';
import { Modules } from '@unchainedshop/types';
import { BookmarkNotFoundError, InvalidIdError } from '../../errors';
import { log } from 'meteor/unchained:logger';

export default async function removeBookmark(
  root: Root,
  { bookmarkId }: { bookmarkId: string },
  { userId, modules }: Context
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
