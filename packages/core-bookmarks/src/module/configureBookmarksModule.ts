import { emitEvent, registerEvents } from 'meteor/unchained:core-events';
import { Bookmark, BookmarksModule } from 'unchained-core-types/bookmarks';
import { ModuleInput } from 'unchained-core-types/common';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { BookmarksCollection } from '../db/BookmarksCollection';
import { BookmarkSchema } from '../db/BookmarksSchema';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];

export const configureBookmarksModule = async ({
  db,
}: ModuleInput): Promise<BookmarksModule> => {
  registerEvents(BOOKMARK_EVENTS);

  const Bookmarks = await BookmarksCollection(db);

  const mutations = generateDbMutations<Bookmark>(Bookmarks, BookmarkSchema);

  return {
    findByUserId: async (userId) => await Bookmarks.find({ userId }).toArray(),
    findByUserIdAndProductId: async ({ userId, productId }) =>
      await Bookmarks.findOne({ userId, productId }),
    findById: async (bookmarkId) => {
      const filter = generateDbFilterById(bookmarkId);
      const bookmark = await Bookmarks.findOne({ _id: filter._id });
      return bookmark;
    },
    find: async (query) => await Bookmarks.find(query).toArray(),
    replaceUserId: async (fromUserId, toUserId) => {
      const result = await Bookmarks.updateMany(
        { userId: fromUserId },
        {
          $set: {
            userId: toUserId,
          },
        }
      );
      return result.upsertedCount;
    },
    removeById: async (bookmarkId) => {
      const deletedCount = await mutations.delete(bookmarkId);
      emitEvent('BOOKMARK_REMOVE', { bookmarkId });
      console.log('DELETE', deletedCount);
      return deletedCount;
    },
    create: async (doc: Bookmark, userId?: string) => {
      const bookmarkId = await mutations.create(doc, userId);
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
    update: mutations.update,
    delete: mutations.delete,
  };
};
