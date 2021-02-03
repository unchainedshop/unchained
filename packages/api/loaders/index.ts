// eslint-disable-next-line @typescript-eslint/no-var-requires
const DataLoader = require('dataloader');

export interface UnchainedServerLoaders {
  bookmarksByQueryLoader: any;
  bookmarkByIdLoader: any;
}

export default async (_, unchained): Promise<UnchainedServerLoaders> => {
  return {
    bookmarksByQueryLoader: new DataLoader(async (queries) => {
      const results = unchained.modules.bookmarks.find({
        $or: queries,
      });
      return queries.map(
        (key: any) =>
          results.find(
            (result) =>
              result.userId === key.userId && result.productId === key.productId
          ) || null
      );
    }),
    bookmarkByIdLoader: new DataLoader(async (ids) => {
      const results = unchained.modules.bookmarks.find({
        _id: {
          $in: ids,
        },
      });
      return ids.map(
        (key) => results.find((result) => result._id === key) || null
      );
    }),
  };
};
