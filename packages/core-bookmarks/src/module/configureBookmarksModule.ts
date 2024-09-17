import { emit, registerEvents } from '@unchainedshop/events';
import { ModuleInput } from '@unchainedshop/core';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { BookmarksCollection } from '../db/BookmarksCollection.js';
import type { TimestampFields } from '@unchainedshop/mongodb';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_UPDATE', 'BOOKMARK_REMOVE'];

export type Bookmark = {
  _id?: string;
  userId: string;
  productId: string;
  meta?: any;
} & TimestampFields;

/*
 * Module
 */

export interface BookmarksModule {
  create: (doc: Bookmark) => Promise<string | null>;
  update: (_id: string, doc: mongodb.UpdateFilter<Bookmark> | Bookmark) => Promise<string>;
  delete: (_id: string) => Promise<number>;
  findBookmarksByUserId: (userId: string) => Promise<Array<Bookmark>>;
  findBookmarkById: (bookmarkId: string) => Promise<Bookmark>;
  findBookmarks: (query: mongodb.Filter<Bookmark>) => Promise<Array<Bookmark>>;
  replaceUserId: (fromUserId: string, toUserId: string, bookmarkIds?: Array<string>) => Promise<number>;
  deleteByUserId: (toUserId: string) => Promise<number>;
  deleteByProductId: (productId: string) => Promise<number>;
  deleteByUserIdAndMeta: (meta: any) => Promise<number>;
}

export const configureBookmarksModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<BookmarksModule> => {
  registerEvents(BOOKMARK_EVENTS);

  const Bookmarks = await BookmarksCollection(db);

  return {
    // Queries
    findBookmarksByUserId: async (userId) => Bookmarks.find({ userId }).toArray(),
    findBookmarkById: async (bookmarkId) => {
      const filter = generateDbFilterById(bookmarkId);
      return Bookmarks.findOne(filter, {});
    },
    findBookmarks: async (query) => Bookmarks.find(query).toArray(),

    // Mutations
    replaceUserId: async (fromUserId, toUserId, bookmarkIds) => {
      const selector: mongodb.Filter<Bookmark> = { userId: fromUserId };
      if (bookmarkIds) {
        selector._id = { $in: bookmarkIds };
      }
      const result = await Bookmarks.updateMany(selector, {
        $set: {
          userId: toUserId,
          updated: new Date(),
        },
      });
      return result.upsertedCount;
    },
    deleteByUserId: async (userId) => {
      const bookmarks = await Bookmarks.find({ userId }, { projection: { _id: true } }).toArray();
      const result = await Bookmarks.deleteMany({ userId });
      await Promise.all(bookmarks.map(async (b) => emit('BOOKMARK_REMOVE', { bookmarkId: b._id })));
      return result.deletedCount;
    },
    deleteByProductId: async (productId) => {
      const bookmarks = await Bookmarks.find({ productId }, { projection: { _id: true } }).toArray();
      const result = await Bookmarks.deleteMany({ productId });
      await Promise.all(bookmarks.map(async (b) => emit('BOOKMARK_REMOVE', { bookmarkId: b._id })));
      return result.deletedCount;
    },
    deleteByUserIdAndMeta: async ({ userId, meta }) => {
      const bookmarks = await Bookmarks.find({ userId, meta }, { projection: { _id: true } }).toArray();
      const result = await Bookmarks.deleteMany({ meta, userId });
      await Promise.all(bookmarks.map(async (b) => emit('BOOKMARK_REMOVE', { bookmarkId: b._id })));
      return result.deletedCount;
    },
    create: async (doc) => {
      const { insertedId: bookmarkId } = await Bookmarks.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
      });
      await emit('BOOKMARK_CREATE', { bookmarkId });
      return bookmarkId;
    },
    update: async (bookmarkId, doc) => {
      await Bookmarks.updateOne(
        { _id: bookmarkId },
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
      );
      await emit('BOOKMARK_UPDATE', { bookmarkId });
      return bookmarkId;
    },
    delete: async (bookmarkId) => {
      const { deletedCount } = await Bookmarks.deleteOne({ _id: bookmarkId });
      await emit('BOOKMARK_REMOVE', { bookmarkId });
      return deletedCount;
    },
  };
};
