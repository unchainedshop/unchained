import { log } from '@unchainedshop/logger';
import { BookmarkAlreadyExistsError, InvalidIdError, ProductNotFoundError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function createBookmark(
  root: never,
  { productId, userId, meta }: { productId: string; userId?: string; meta?: any },
  { modules, userId: currentUserId }: Context,
) {
  // Defense-in-depth: bind the bookmark to the authenticated user unless a target
  // userId is explicitly supplied. Authorization to create a bookmark for a *different*
  // user is enforced by the createBookmark ACL predicate (self-or-admin); this fallback
  // also prevents an empty-string userId from creating an owner-less bookmark.
  const targetUserId = userId || currentUserId;

  log(`mutation createBookmark for ${targetUserId}`, {
    productId,
    userId: currentUserId,
  });
  if (!productId) throw new InvalidIdError({ productId });
  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const [bookmark] = await modules.bookmarks.findBookmarks({
    productId,
    userId: targetUserId,
    meta,
  });

  if (bookmark) throw new BookmarkAlreadyExistsError({ bookmarkId: bookmark._id });

  const bookmarkId = await modules.bookmarks.create({
    userId: targetUserId,
    productId,
    meta,
  });

  return modules.bookmarks.findBookmarkById(bookmarkId);
}
