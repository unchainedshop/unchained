import { emit, registerEvents } from 'meteor/unchained:events';
import { Bookmark, BookmarksModule } from '@unchainedshop/types/bookmarks';
import { ModuleInput } from '@unchainedshop/types/common';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { BookmarksCollection } from '../db/BookmarksCollection';
import { BookmarkSchema } from '../db/BookmarksSchema';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARKS_UPDATE', 'BOOKMARK_REMOVE'];

export const configureBookmarksModule = async ({
  db,
}: ModuleInput): Promise<BookmarksModule> => {
  registerEvents(BOOKMARK_EVENTS);

  const Bookmarks = await BookmarksCollection(db);

  const mutations = generateDbMutations<Bookmark>(Bookmarks, BookmarkSchema);

  return {
    findByUserId: async (userId) => Bookmarks.find({ userId }).toArray(),
    findByUserIdAndProductId: async ({ userId, productId }) =>
      Bookmarks.findOne({ userId, productId }),
    findById: async (bookmarkId) => {
      let bookmark: Bookmark;
      if (bookmarkId) {
        const filter = generateDbFilterById(bookmarkId);
        bookmark = await Bookmarks.findOne({ _id: filter._id });
      }
      return bookmark;
    },
    find: async (query) => Bookmarks.find(query).toArray(),
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
    create: async (doc: Bookmark, userId: string) => {
      const bookmarkId = await mutations.create(doc, userId);
      emit('BOOKMARK_CREATE', { bookmarkId });
      return bookmarkId;
    },
    update: async (_id:string, doc: Bookmark, userId: string) => {
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
