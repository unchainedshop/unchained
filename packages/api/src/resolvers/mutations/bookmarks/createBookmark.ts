import { log } from '@unchainedshop/logger';
import { BookmarkAlreadyExistsError, InvalidIdError, ProductNotFoundError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function createBookmark(
  root: never,
  { productId, userId, meta }: { productId: string; userId: string; meta?: any },
  { modules, userId: currentUserId }: Context,
) {
  log(`mutation createBookmark for ${userId}`, {
    productId,
    userId: currentUserId,
  });
  if (!productId) throw new InvalidIdError({ productId });
  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const [bookmark] = await modules.bookmarks.findBookmarks({
    productId,
    userId,
  });

  if (bookmark) throw new BookmarkAlreadyExistsError({ bookmarkId: bookmark._id });

  const bookmarkId = await modules.bookmarks.create({
    userId,
    productId,
    meta,
  });

  return modules.bookmarks.findBookmarkById(bookmarkId);
}
