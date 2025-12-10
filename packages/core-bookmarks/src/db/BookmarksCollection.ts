import { mongodb } from '@unchainedshop/mongodb';
import type { Bookmark } from '../bookmarks-index.ts';

export const BookmarksCollection = async (db: mongodb.Db) => {
  const Bookmarks = db.collection<Bookmark>('bookmarks');

  await Bookmarks.createIndex({ userId: 1 });
  await Bookmarks.createIndex({ productId: 1 });

  return Bookmarks;
};
