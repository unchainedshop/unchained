import { log } from 'meteor/unchained:logger';
import { Products } from 'meteor/unchained:core-products';
import {
  BookmarkAlreadyExistsError,
  InvalidIdError,
  ProductNotFoundError,
} from '../../../errors';
import { Context, Root } from '@unchainedshop/types/api';

export default async function createBookmark(
  root: Root,
  { productId, userId }: { productId: string; userId: string },
  { modules, userId: currenctUserId }: Context
) {
  log(`mutation createBookmark for ${userId}`, {
    productId,
    userId: currenctUserId,
  });
  if (!productId) throw new InvalidIdError({ productId });
  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });

  const bookmark = await modules.bookmarks.findByUserIdAndProductId({
    productId,
    userId,
  });

  if (bookmark)
    throw new BookmarkAlreadyExistsError({ bookmarkId: bookmark._id });

  const bookmarkId = await modules.bookmarks.create(
    {
      userId,
      productId,
    },
    currenctUserId
  );

  return await modules.bookmarks.findById(bookmarkId);
}
