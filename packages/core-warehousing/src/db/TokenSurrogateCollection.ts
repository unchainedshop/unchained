import { Db } from '@unchainedshop/types/common';
import { TokenSurrogate } from '@unchainedshop/types/warehousing';
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
