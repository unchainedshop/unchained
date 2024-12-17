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
  ]);

  return TokenSurrogates;
};
