import { UnchainedAPI, UnchainedLoaders } from '@unchainedshop/types/api';
import DataLoader from 'dataloader';
import { Request } from 'express';

export default async (req: Request, unchainedAPI: UnchainedAPI): Promise<UnchainedLoaders> => {
  return {
    bookmarksByQueryLoader: new DataLoader(async (queries) => {
      const results = await unchainedAPI.modules.bookmarks.find({
        $or: queries,
      });
      return queries.map(
        (key: any) =>
          results.find((result) => result.userId === key.userId && result.productId === key.productId) ||
          null,
      );
    }),
    bookmarkByIdLoader: new DataLoader(async (ids) => {
      const results = await unchainedAPI.modules.bookmarks.find({
        _id: {
          $in: ids,
        },
      });
      return ids.map((key) => results.find((result) => result._id === key) || null);
    }),
  };
};
