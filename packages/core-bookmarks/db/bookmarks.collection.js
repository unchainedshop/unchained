import { BookmarkSchema } from './bookmarks.schema'

export const configureBookmarksCollection = (db) => {
  const Bookmarks = db.Collection('bookmarks');
  Bookmarks.attachSchema(BookmarkSchema);

  Bookmarks.rawCollection().createIndex({ userId: 1 });
  Bookmarks.rawCollection().createIndex({ productId: 1 });

  return Bookmarks;
};


