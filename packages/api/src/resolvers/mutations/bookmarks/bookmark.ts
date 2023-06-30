import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import {
  InvalidIdError,
  ProductNotFoundError,
  BookmarkNotFoundError,
  MultipleBookmarksFound,
} from '../../../errors.js';

export default async function bookmark(
  root: Root,
  { productId, bookmarked }: { productId: string; bookmarked: string },
  { userId, modules }: Context,
) {
  log('mutation bookmark', { productId, userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const foundBookmarks = await modules.bookmarks.findBookmarks({
    productId,
    userId,
  });

  if (foundBookmarks.length > 1) {
    throw new MultipleBookmarksFound({
      productId,
      userId,
      bookmarkIds: foundBookmarks.map((b) => b._id),
    });
  }

  const foundBookmark = foundBookmarks[0];

  if (bookmarked) {
    if (foundBookmark) return foundBookmark;

    const bookmarkId = await modules.bookmarks.create({
      productId,
      userId,
    });

    return modules.bookmarks.findById(bookmarkId);
  }

  if (!foundBookmark) {
    throw new BookmarkNotFoundError({ productId, userId });
  }

  await modules.bookmarks.delete(foundBookmark._id);

  return foundBookmark;
}
