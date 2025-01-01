import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
  TimestampFields,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { BookmarksCollection } from '../db/BookmarksCollection.js';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_UPDATE', 'BOOKMARK_REMOVE'];

export type Bookmark = {
  _id?: string;
  userId: string;
  productId: string;
  meta?: any;
} & TimestampFields;

export const configureBookmarksModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(BOOKMARK_EVENTS);

  const Bookmarks = await BookmarksCollection(db);

  return {
    // Queries
    findBookmarksByUserId: async (userId: string): Promise<Array<Bookmark>> =>
      Bookmarks.find({ userId }).toArray(),
    findBookmarkById: async (bookmarkId: string): Promise<Bookmark> => {
      const filter = generateDbFilterById(bookmarkId);
      return Bookmarks.findOne(filter, {});
    },
    findBookmarks: async (query: mongodb.Filter<Bookmark>): Promise<Array<Bookmark>> =>
      Bookmarks.find(query).toArray(),

    // Mutations
    replaceUserId: async (
      fromUserId: string,
      toUserId: string,
      bookmarkIds?: Array<string>,
    ): Promise<number> => {
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
    deleteByUserId: async (userId: string) => {
      const bookmarks = await Bookmarks.find({ userId }, { projection: { _id: true } }).toArray();
      const result = await Bookmarks.deleteMany({ userId });
      await Promise.all(bookmarks.map(async (b) => emit('BOOKMARK_REMOVE', { bookmarkId: b._id })));
      return result.deletedCount;
    },
    deleteByProductId: async (productId: string) => {
      const bookmarks = await Bookmarks.find({ productId }, { projection: { _id: true } }).toArray();
      const result = await Bookmarks.deleteMany({ productId });
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
    update: async (bookmarkId: string, doc: Partial<Bookmark>) => {
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
    delete: async (bookmarkId: string) => {
      const { deletedCount } = await Bookmarks.deleteOne({ _id: bookmarkId });
      await emit('BOOKMARK_REMOVE', { bookmarkId });
      return deletedCount;
    },
  };
};

export type BookmarksModule = Awaited<ReturnType<typeof configureBookmarksModule>>;
