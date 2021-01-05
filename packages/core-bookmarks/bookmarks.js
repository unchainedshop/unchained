import './db/helpers';
import DataLoader from 'dataloader';
import runMigrations from './db/schema';
import { Bookmarks } from './db/collections';

export * from './db/collections';

export const services = {};

// eslint-disable-next-line
export default (config) => {
  runMigrations();
  // eslint-disable-next-line
  return (req) => {
    const bookmarksByQueryLoader = new DataLoader(async (queries) => {
      const results = Bookmarks.find({
        $or: queries,
      }).fetch();
      return queries.map(
        (key) =>
          results.find(
            (result) =>
              result.userId === key.userId && result.productId === key.productId
          ) || null
      );
    });
    const bookmarkByIdLoader = new DataLoader(async (keys) => {
      const results = Bookmarks.find({
        _id: {
          $in: keys,
        },
      }).fetch();
      return keys.map(
        (key) => results.find((result) => result._id === key) || null
      );
    });
    return {
      findBookmarkByUserIdAndProductId: async ({ userId, productId }) =>
        bookmarksByQueryLoader.load({ userId, productId }),
      findBookmarkById: async (bookmarkId) =>
        bookmarkByIdLoader.load(bookmarkId),
      removeBookmarkById: async (bookmarkId) => {
        return Bookmarks.removeBookmark({ bookmarkId });
      },
      createBookmark: async (bookmarkData) => {
        return Bookmarks.createBookmark(bookmarkData);
      },
    };
  };
};
