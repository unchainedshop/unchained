import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function getUserBookmarks(context: Context, params: Params<'GET_BOOKMARKS'>) {
  const { modules } = context;
  const { userId } = params;
  const bookmark = await modules.bookmarks.findBookmarksByUserId(userId);

  return { bookmark };
}
