import { emit, registerEvents } from '@unchainedshop/events';
import { Bookmark, BookmarksModule } from '@unchainedshop/types/bookmarks';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { BookmarksCollection } from '../db/BookmarksCollection';
import { BookmarkSchema } from '../db/BookmarksSchema';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARKS_UPDATE', 'BOOKMARK_REMOVE'];

export const configureBookmarksModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<BookmarksModule> => {
  registerEvents(BOOKMARK_EVENTS);

  const Bookmarks = await BookmarksCollection(db);

  const mutations = generateDbMutations<Bookmark>(Bookmarks, BookmarkSchema, {
    permanentlyDeleteByDefault: true,
  }) as ModuleMutations<Bookmark>;

  return {
    // Queries
    ...mutations,
    findByUserId: async (userId) => Bookmarks.find({ userId }).toArray(),
    findByUserIdAndProductId: async ({ userId, productId }) => Bookmarks.findOne({ userId, productId }),
    findById: async (bookmarkId) => {
      const filter = generateDbFilterById(bookmarkId);
      return Bookmarks.findOne(filter, {});
    },

    find: async (query) => Bookmarks.find(query).toArray(),

    existsByUserIdAndProductId: async ({ productId, userId }) => {
      let selector = {};
      if (productId && userId) {
        selector = { userId, productId };
      } else if (userId) {
        selector = { userId };
      }
      const bookmarkCount = await Bookmarks.countDocuments(selector, {
        limit: 1,
      });

      return !!bookmarkCount;
    },

    // Mutations
    replaceUserId: async (fromUserId, toUserId, userId) => {
      const result = await Bookmarks.updateMany(
        { userId: fromUserId },
        {
          $set: {
            userId: toUserId,
            updated: new Date(),
            updatedBy: userId,
          },
        },
      );
      return result.upsertedCount;
    },

    deleteByUserId: async (toUserId) => {
      const result = await Bookmarks.deleteMany({ userId: toUserId });

      return result.deletedCount;
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
