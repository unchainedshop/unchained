import { emitEvent, registerEvents } from 'unchained-core-events';
import { BookmarksModule } from 'unchained-core-types/types/bookmarks';
import { ModuleInput } from 'unchained-core-types/types/common';
import { BookmarksCollection } from '../db/BookmarksCollection';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];

export const configureBookmarksModule = async ({ db }: ModuleInput): Promise<BookmarksModule> => {
  registerEvents(BOOKMARK_EVENTS);

  const Bookmarks = await BookmarksCollection(db);

  return {
    findByUserId: async (userId) => await Bookmarks.find({ userId }).fetch(),
    findByUserIdAndProductId: async ({ userId, productId }) =>
      await Bookmarks.findOne({ userId, productId }),
    findById: async (bookmarkId) =>
      await Bookmarks.findOne({ _id: bookmarkId }),
    find: async (query) => await Bookmarks.find(query).fetch(),
    replaceUserId: async (fromUserId, toUserId) =>
      await Bookmarks.update(
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
      const result = await Bookmarks.remove({ _id: bookmarkId });
      emitEvent('BOOKMARK_REMOVE', { bookmarkId });
      return result;
    },
    create: async ({ userId, productId, ...rest }) => {
      const bookmarkId = await Bookmarks.insert({
        ...rest,
        created: new Date(),
        userId,
        productId,
      });
      emitEvent('BOOKMARK_CREATE', { bookmarkId });
      return bookmarkId;
    },
    existsByUserIdAndProductId: async ({ productId, userId }) => {
      let selector = {};
      if (productId && userId) {
        selector = { userId, productId };
      } else if (userId) {
        selector = { userId };
      }
      const bookmarkCount = await Bookmarks.find(selector, {
        limit: 1,
      }).count();

      return !!bookmarkCount;
    },
  };
};
