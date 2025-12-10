import type { Context } from '../../../../context.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

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
