import { log } from 'unchained-logger';
import { Products } from 'meteor/unchained:core-products';
import {
  InvalidIdError,
  ProductNotFoundError,
  BookmarkNotFoundError,
} from '../../errors';

export default async function bookmark(
  root,
  { productId, bookmarked },
  { userId, modules }
) {
  log('mutation bookmark', { productId, userId });

  if (!productId) throw new InvalidIdError({ productId });
  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });

  const foundBookmark = await modules.bookmarks.findByUserIdAndProductId({
    productId,
    userId,
  });

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

  await modules.bookmarks.removeById(foundBookmark._id);
  return foundBookmark;
}
