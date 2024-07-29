import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { TokenSurrogate } from '../types.js';

export const TokenSurrogateCollection = async (db: mongodb.Db) => {
  const TokenSurrogates = db.collection<TokenSurrogate>('token_surrogates');

  await buildDbIndexes<TokenSurrogate>(TokenSurrogates, [
    {
      index: {
        chainTokenId: 1,
      },
    },
    {
      index: {
        userId: 1,
      },
    },
    {
      index: {
        productId: 1,
      },
    },
    {
      index: {
        orderPositionId: 1,
      },
    },
  ]);

  return TokenSurrogates;
};
