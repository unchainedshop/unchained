import { Context } from '../../../../context.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getUserBookmarks(context: Context, params: Params<'GET_BOOKMARKS'>) {
  const { modules } = context;
  const { userId } = params;
  const bookmarks = await modules.bookmarks.findBookmarksByUserId(userId);
  const normalizedBookmarks = await Promise.all(
    bookmarks.map(async ({ productId, ...bookmark }) => ({
      ...(await getNormalizedProductDetails(productId, context)),
      ...bookmark,
    })),
  );
  return { bookmarks: normalizedBookmarks };
}
