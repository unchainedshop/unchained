import { UnchainedBookmarkAPI } from 'core/types';
import { emit } from 'meteor/unchained:core-events';

export const configurBookmarksAPI = (Bookmarks: any): UnchainedBookmarkAPI => ({
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
    const result = Bookmarks.remove({ _id: bookmarkId });
    emit('BOOKMARK_REMOVE', { bookmarkId });
    return result;
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
});
