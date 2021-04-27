import { registerEvents, emit } from 'meteor/unchained:core-events';
import { Mongo } from 'meteor/mongo';
import createIndexes from './db/schema';
import { Bookmarks } from './db/collections';

export * from './db/collections';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];

export const services = {
  migrateBookmarks: async (
    { fromUserId, toUserId, mergeBookmarks },
    { modules }
  ) => {
    const fromBookmarks = await modules.bookmarks.find({ userId: fromUserId });
    if (!fromBookmarks) {
      // No bookmarks no copy needed
      return;
    }
    if (!mergeBookmarks) {
      await modules.bookmarks.removeById(toUserId);
    }
    await modules.bookmarks.replaceUserId(fromUserId, toUserId);
  },
};

export type Bookmark = {
  userId: string;
  productId: string;
};

export type UnchainedBookmarkAPI = {
  findByUserId(userId: string): Promise<Array<Bookmark>>;
  findByUserIdAndProductId({
    userId,
    productId,
  }: {
    userId: string;
    productId: string;
  }): Promise<Bookmark>;
  findById(bookmarkId: string): Promise<Bookmark>;
  find(query: Mongo.Query<Bookmark>): Promise<Array<Bookmark>>;
  replaceUserId(fromUserId: string, toUserId: string): Promise<number>;
  removeById(bookmarkId: string): Promise<number>;
  create(data: Bookmark): Promise<string>;
  existsByUserIdAndProductId({
    userId,
    productId,
  }: {
    userId: string;
    productId: string;
  }): Promise<boolean>;
};

// eslint-disable-next-line
export default (): UnchainedBookmarkAPI => {
  createIndexes();
  registerEvents(BOOKMARK_EVENTS);
  return {
    findByUserId: async (userId) => Bookmarks.find({ userId }).fetch(),
    findByUserIdAndProductId: async ({ userId, productId }) =>
      Bookmarks.findOne({ userId, productId }),
    findById: async (bookmarkId) => Bookmarks.findOne({ _id: bookmarkId }),
    find: async (query) => Bookmarks.find(query).fetch(),
    replaceUserId: async (fromUserId, toUserId) =>
      Bookmarks.update(
        { userId: fromUserId },
        {
          $set: {
            userId: toUserId,
          },
        },
        {
          multi: true,
        }
      ),
    removeById: async (bookmarkId) => {
      emit('BOOKMARK_REMOVE', { bookmarkId });
      return Bookmarks.remove({ _id: bookmarkId });
    },
    create: async ({ userId, productId, ...rest }) => {
      const bookmarkId = Bookmarks.insert({
        ...rest,
        created: new Date(),
        userId,
        productId,
      });
      emit('BOOKMARK_CREATE', { bookmarkId });
      return bookmarkId;
    },
    existsByUserIdAndProductId: async ({ productId, userId }) => {
      let selector = {};
      if (productId && userId) {
        selector = { userId, productId };
      } else if (userId) {
        selector = { userId };
      }
      return !!Bookmarks.find(selector, { limit: 1 }).count();
    },
  };
};
