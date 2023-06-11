import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidIdError, ProductNotFoundError, BookmarkNotFoundError } from '../../../errors.js';

export default async function bookmark(
  root: Root,
  { productId, bookmarked, meta }: { productId: string; bookmarked: string; meta: JSON },
  { userId, modules }: Context,
) {
  log('mutation bookmark', { productId, userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const [foundBookmark] = await modules.bookmarks.find({
    productId,
    userId,
    meta,
  });

  if (bookmarked) {
    if (foundBookmark) return foundBookmark;

    const bookmarkId = await modules.bookmarks.create({
      productId,
      userId,
      meta,
    });

    return modules.bookmarks.findById(bookmarkId);
  }

  if (!foundBookmark) {
    throw new BookmarkNotFoundError({ productId, userId });
  }

  await modules.bookmarks.delete(foundBookmark._id);

  return foundBookmark;
}
