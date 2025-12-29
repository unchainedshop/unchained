import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import type { Bookmark } from '../bookmarks-index.ts';

export const BookmarksCollection = async (db: mongodb.Db) => {
  const Bookmarks = db.collection<Bookmark>('bookmarks');

  await buildDbIndexes<Bookmark>(Bookmarks, [
    { index: { deleted: 1 } },
    { index: { userId: 1 } },
    { index: { productId: 1 } },
  ]);

  return Bookmarks;
};
