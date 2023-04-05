import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { TokenSurrogate } from '@unchainedshop/types/warehousing.js';

export const TokenSurrogateCollection = async (db: mongodb.Db) => {
  const TokenSurrogates = db.collection<TokenSurrogate>('token_surrogates');

  await buildDbIndexes<TokenSurrogate>(TokenSurrogates, [
    {
      index: {
        chainTokenId: 1,
      },
    },
  ]);

  return TokenSurrogates;
};
