import { Db } from 'unchained-core-types';
import { Bookmark } from 'unchained-core-types/lib/bookmarks';

export const BookmarksCollection = async (db: Db) => {
  const Bookmarks = db.collection<Bookmark>('bookmarks');
  
  await Bookmarks.createIndex({ userId: 1 });
  await Bookmarks.createIndex({ productId: 1 });

  return Bookmarks;
};


