import { emit, registerEvents } from '@unchainedshop/events';
import { Bookmark, BookmarksModule } from '@unchainedshop/types/bookmarks';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { BookmarksCollection } from '../db/BookmarksCollection.js';
import { BookmarkSchema } from '../db/BookmarksSchema.js';

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
    replaceUserId: async (fromUserId, toUserId) => {
      const result = await Bookmarks.updateMany(
        { userId: fromUserId },
        {
          $set: {
            userId: toUserId,
            updated: new Date(),
          },
        },
      );
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
    create: async (doc: Bookmark) => {
      const bookmarkId = await mutations.create(doc);
      await emit('BOOKMARK_CREATE', { bookmarkId });
      return bookmarkId;
    },
    update: async (_id: string, doc: Bookmark) => {
      const bookmarkId = await mutations.update(_id, doc);
      await emit('BOOKMARK_UPDATE', { bookmarkId });
      return bookmarkId;
    },
    delete: async (bookmarkId) => {
      const deletedCount = await mutations.delete(bookmarkId);
      await emit('BOOKMARK_REMOVE', { bookmarkId });
      return deletedCount;
    },
  };
};
