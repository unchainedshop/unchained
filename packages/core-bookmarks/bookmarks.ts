import createIndexes from './db/schema';
import { Bookmarks } from './db/collections';

export * from './db/collections';

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

export interface UnchainedBookmarkAPI {
  findByUserId({ userId: String }): Promise<Array>;
}

// eslint-disable-next-line
export default (config): UnchainedBookmarkAPI => {
  createIndexes();
  return {
    findByUserId: async ({ userId }) => Bookmarks.find({ userId }).fetch(),
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
      return Bookmarks.remove({ _id: bookmarkId });
    },
    create: async ({ userId, productId, ...rest }) => {
      const bookmarkId = Bookmarks.insert({
        ...rest,
        created: new Date(),
        userId,
        productId,
      });
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
