import { BookmarkSchema } from './BookmarksSchema'

export const BookmarksCollection = (db) => {
  const Bookmarks = new db.Collection('bookmarks');
  Bookmarks.attachSchema(BookmarkSchema);

  Bookmarks.createIndex({ userId: 1 });
  Bookmarks.createIndex({ productId: 1 });

  return Bookmarks;
};


