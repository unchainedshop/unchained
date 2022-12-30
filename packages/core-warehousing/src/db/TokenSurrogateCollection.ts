import { Db } from '@unchainedshop/types/common.js';
import { TokenSurrogate } from '@unchainedshop/types/warehousing.js';
import { buildDbIndexes } from '@unchainedshop/utils';

export const TokenSurrogateCollection = async (db: Db) => {
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
