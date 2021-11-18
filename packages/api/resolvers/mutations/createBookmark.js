import { log } from 'unchained-logger';
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

  const bookmark = await modules.bookmarks.findByUserIdAndProductId({
    productId,
    userId: foreignUserId,
  });

  if (bookmark)
    throw new BookmarkAlreadyExistsError({ bookmarkId: bookmark._id });

  const bookmarkId = await modules.bookmarks.create({
    userId: foreignUserId,
    productId,
  });
  return modules.bookmarks.findById(bookmarkId);
}
