import { registerEvents } from 'meteor/unchained:core-events';
import { UnchainedBookmarkAPI } from 'core/types';
import { configurBookmarksAPI } from './api/bookmarks.api';
import { configureBookmarksCollection } from './db/bookmarks.collection';

const BOOKMARK_EVENTS: string[] = ['BOOKMARK_CREATE', 'BOOKMARK_REMOVE'];

// eslint-disable-next-line
export const configureBookmarks =
  async (db: any): Promise<UnchainedBookmarkAPI> => {
    registerEvents(BOOKMARK_EVENTS);
    
    const collection = configureBookmarksCollection(db);
    const api = configurBookmarksAPI(collection);

    return api;

    // return {
    //   findByUserId: async (userId) => Bookmarks.find({ userId }).fetch(),
    //   findByUserIdAndProductId: async ({ userId, productId }) =>
    //     Bookmarks.findOne({ userId, productId }),
    //   findById: async (bookmarkId) => Bookmarks.findOne({ _id: bookmarkId }),
    //   find: async (query) => Bookmarks.find(query).fetch(),
    //   replaceUserId: async (fromUserId, toUserId) =>
    //     Bookmarks.update(
    //       { userId: fromUserId },
    //       {
    //         $set: {
    //           userId: toUserId,
    //         },
    //       },
    //       {
    //         multi: true,
    //       }
    //     ),
    //   removeById: async (bookmarkId) => {
    //     const result = Bookmarks.remove({ _id: bookmarkId });
    //     emit('BOOKMARK_REMOVE', { bookmarkId });
    //     return result;
    //   },
    //   create: async ({ userId, productId, ...rest }) => {
    //     const bookmarkId = Bookmarks.insert({
    //       ...rest,
    //       created: new Date(),
    //       userId,
    //       productId,
    //     });
    //     emit('BOOKMARK_CREATE', { bookmarkId });
    //     return bookmarkId;
    //   },
    //   existsByUserIdAndProductId: async ({ productId, userId }) => {
    //     let selector = {};
    //     if (productId && userId) {
    //       selector = { userId, productId };
    //     } else if (userId) {
    //       selector = { userId };
    //     }
    //     return !!Bookmarks.find(selector, { limit: 1 }).count();
    //   },
    // };
  };
