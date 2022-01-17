import { emit, registerEvents } from 'meteor/unchained:events';
import { Bookmark, BookmarksModule } from '@unchainedshop/types/bookmarks';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { BookmarksCollection } from '../db/BookmarksCollection';
import { BookmarkSchema } from '../db/BookmarksSchema';

const BOOKMARK_EVENTS: string[] = [
  'BOOKMARK_CREATE',
  'BOOKMARKS_UPDATE',
  'BOOKMARK_REMOVE',
];

export const configureBookmarksModule = async ({
  db,
}: ModuleInput<{}>): Promise<BookmarksModule> => {
  registerEvents(BOOKMARK_EVENTS);

  const Bookmarks = await BookmarksCollection(db);

  const mutations = generateDbMutations<Bookmark>(
    Bookmarks,
    BookmarkSchema
  ) as ModuleMutations<Bookmark>;

  return {
    // Queries
    findByUserId: async (userId) =>
      Bookmarks.find({ userId, deleted: null }).toArray(),
    findByUserIdAndProductId: async ({ userId, productId }) =>
      Bookmarks.findOne({ userId, productId, deleted: null }),
    findById: async (bookmarkId) => {
      let bookmark: Bookmark;
      if (bookmarkId) {
        const filter = generateDbFilterById(bookmarkId, { deleted: null });
        bookmark = await Bookmarks.findOne(filter);
      }
      return bookmark;
    },
    find: async (query) => Bookmarks.find(query).toArray(),
    existsByUserIdAndProductId: async ({ productId, userId }) => {
      let selector = {};
      if (productId && userId) {
        selector = { userId, productId, deleted: null };
      } else if (userId) {
        selector = { userId, deleted: null };
      }
      const bookmarkCount = await Bookmarks.find(selector, {
        limit: 1,
      }).count();

      return !!bookmarkCount;
    },

    // Mutations
    replaceUserId: async (fromUserId, toUserId, userId) => {
      const result = await Bookmarks.updateMany(
        { userId: fromUserId, deleted: null },
        {
          $set: {
            userId: toUserId,
            updated: new Date(),
            updatedBy: userId,
          },
        }
      );
      return result.upsertedCount;
    },
    deleteByUserId: async (toUserId, userId) => {
      const result = await Bookmarks.updateMany(
        { userId: toUserId },
        {
          $set: {
            deleted: new Date(),
            deletedBy: userId,
          },
        }
      );

      return result.modifiedCount;
    },

    create: async (doc: Bookmark, userId: string) => {
      const bookmarkId = await mutations.create(doc, userId);
      emit('BOOKMARK_CREATE', { bookmarkId });
      return bookmarkId;
    },
    update: async (_id: string, doc: Bookmark, userId: string) => {
      const bookmarkId = await mutations.update(_id, doc, userId);
      emit('BOOKMARK_UPDATE', { bookmarkId });
      return bookmarkId;
    },
    delete: async (bookmarkId, userId) => {
      const deletedCount = await mutations.delete(bookmarkId, userId);
      emit('BOOKMARK_REMOVE', { bookmarkId });
      return deletedCount;
    },
  };
};
