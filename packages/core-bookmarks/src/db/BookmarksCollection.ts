import { Db } from '@unchainedshop/types';
import { Bookmark } from '@unchainedshop/types/bookmarks';

export const BookmarksCollection = async (db: Db) => {
  const Bookmarks = db.collection<Bookmark>('bookmarks');

  await Bookmarks.createIndex({ userId: 1 });
  await Bookmarks.createIndex({ productId: 1 });

  return Bookmarks;
};
