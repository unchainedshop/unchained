import { mongodb } from '@unchainedshop/mongodb';
import { Bookmark } from '@unchainedshop/types/bookmarks.js';

export const BookmarksCollection = async (db: mongodb.Db) => {
  const Bookmarks = db.collection<Bookmark>('bookmarks');

  await Bookmarks.createIndex({ userId: 1 });
  await Bookmarks.createIndex({ productId: 1 });

  return Bookmarks;
};
