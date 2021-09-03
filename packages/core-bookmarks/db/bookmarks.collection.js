import { Mongo } from 'unchained:core-mongodb';
import { BookmarkSchema } from './bookmarks.schema'

export const Bookmarks = new Mongo.Collection('bookmarks');

export const configureBookmarksCollection = (db) => {
  // TODO: Create collection from db context
  return Bookmarks;
};

Bookmarks.attachSchema(BookmarkSchema)

Bookmarks.rawCollection().createIndex({ userId: 1 });
Bookmarks.rawCollection().createIndex({ productId: 1 });
