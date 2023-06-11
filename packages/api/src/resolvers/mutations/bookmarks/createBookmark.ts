import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { BookmarkAlreadyExistsError, InvalidIdError, ProductNotFoundError } from '../../../errors.js';

export default async function createBookmark(
  root: Root,
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

  const [bookmark] = await modules.bookmarks.find({
    productId,
    userId,
    meta,
  });

  if (bookmark) throw new BookmarkAlreadyExistsError({ bookmarkId: bookmark._id });

  const bookmarkId = await modules.bookmarks.create({
    userId,
    productId,
    meta,
  });

  return modules.bookmarks.findById(bookmarkId);
}
