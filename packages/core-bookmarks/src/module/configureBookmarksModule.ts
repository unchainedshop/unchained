import { BookmarksModule, EventsModule } from 'unchained-core-types';

export const configureBookmarksModule = (
  Bookmarks: any,
  events: EventsModule
): BookmarksModule => ({
  findByUserId: async (userId) => await Bookmarks.find({ userId }).fetch(),
  findByUserIdAndProductId: async ({ userId, productId }) =>
    await Bookmarks.findOne({ userId, productId }),
  findById: async (bookmarkId) => await Bookmarks.findOne({ _id: bookmarkId }),
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
    events.emit('BOOKMARK_REMOVE', { bookmarkId });
    return result;
  },
  create: async ({ userId, productId, ...rest }) => {
    const bookmarkId = await Bookmarks.insert({
      ...rest,
      created: new Date(),
      userId,
      productId,
    });
    events.emit('BOOKMARK_CREATE', { bookmarkId });
    return bookmarkId;
  },
  existsByUserIdAndProductId: async ({ productId, userId }) => {
    let selector = {};
    if (productId && userId) {
      selector = { userId, productId };
    } else if (userId) {
      selector = { userId };
    }
    const bookmarkCount = await Bookmarks.find(selector, { limit: 1 }).count();

    return !!bookmarkCount;
  },
});
