import DataLoader from 'dataloader';

export interface UnchainedServerLoaders {
  bookmarksByQueryLoader: any;
  bookmarkByIdLoader: any;
}

export default async (req, unchained): Promise<UnchainedServerLoaders> => {
  return {
    bookmarksByQueryLoader: new DataLoader(async (queries) => {
      const results = unchained.modules.bookmarks.find({
        $or: queries,
      });
      return queries.map(
        (key) =>
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
