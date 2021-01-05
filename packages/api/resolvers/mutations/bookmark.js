import { log } from 'meteor/unchained:core-logger';
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

  const foundBookmark = await modules.bookmarks.findBookmarkByUserIdAndProductId(
    { productId, userId }
  );

  if (bookmarked) {
    if (foundBookmark) return foundBookmark;
    const newBookmarkId = modules.bookmarks.createBookmark({
      productId,
      userId,
    });
    return modules.bookmarks.findBookmarkById(newBookmarkId);
  }
  if (!foundBookmark) {
    throw new BookmarkNotFoundError({ productId, userId });
  }

  await modules.bookmarks.removeBookmarkById(foundBookmark._id);
  return foundBookmark;
}
