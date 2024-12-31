import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';

export type TokenSurrogate = {
  _id?: string;
  userId?: string;
  walletAddress?: string;
  invalidatedDate?: Date;
  expiryDate?: Date;
  quantity: number;
  contractAddress: string;
  chainId: string;
  chainTokenId: string;
  productId: string;
  orderPositionId: string;
  meta: any;
};

export enum TokenStatus {
  CENTRALIZED = 'CENTRALIZED',
  EXPORTING = 'EXPORTING',
  DECENTRALIZED = 'DECENTRALIZED',
}

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
    {
      index: {
        chainTokenId: 'text',
        userId: 'text',
        productId: 'text',
        _id: 'text',
        walletAddress: 'text',
        contractAddress: 'text',
      } as any,
      options: {
        weights: {
          _id: 9,
          chainTokenId: 8,
          userId: 3,
          productId: 6,
          contractAddress: 5,
          walletAddress: 4,
          status: 1,
        },
        name: 'token_fulltext_search',
      },
    },
  ]);

  return TokenSurrogates;
};
