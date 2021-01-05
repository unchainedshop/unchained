import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import {
  BookmarkAlreadyExistsError,
  InvalidIdError,
  ProductNotFoundError,
} from '../../errors';

export default async function createBookmark(
  root,
  { productId, userId: foreignUserId },
  { userId, modules }
) {
  log(`mutation createBookmark for ${foreignUserId}`, {
    productId,
    userId,
  });
  if (!productId) throw new InvalidIdError({ productId });
  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });

  const bookmark = await modules.bookmarks.findBookmarkByUserIdAndProductId({
    productId,
    userId: foreignUserId,
  });

  if (bookmark)
    throw new BookmarkAlreadyExistsError({ bookmarkId: bookmark._id });

  const bookmarkId = await modules.bookmarks.createBookmark({
    userId: foreignUserId,
    productId,
  });
  return modules.bookmarks.findBookmarkById(bookmarkId);
}
