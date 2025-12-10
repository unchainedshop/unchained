import { type mongodb, buildDbIndexes, isDocumentDBCompatModeEnabled } from '@unchainedshop/mongodb';

export interface TokenSurrogate {
  _id: string;
  userId?: string;
  walletAddress?: string;
  invalidatedDate?: Date | null;
  expiryDate?: Date;
  quantity: number;
  contractAddress?: string;
  chainId?: string;
  tokenSerialNumber: string;
  productId: string;
  orderPositionId: string;
  meta: any;
}

export const TokenStatus = {
  CENTRALIZED: 'CENTRALIZED',
  EXPORTING: 'EXPORTING',
  DECENTRALIZED: 'DECENTRALIZED',
} as const;

export type TokenStatus = (typeof TokenStatus)[keyof typeof TokenStatus];

export const TokenSurrogateCollection = async (db: mongodb.Db) => {
  const TokenSurrogates = db.collection<TokenSurrogate>('token_surrogates');

  if (!isDocumentDBCompatModeEnabled()) {
    await buildDbIndexes<TokenSurrogate>(
      TokenSurrogates,
      [
        {
          index: {
            tokenSerialNumber: 'text',
            userId: 'text',
            productId: 'text',
            _id: 'text',
            walletAddress: 'text',
            contractAddress: 'text',
          } as any,
          options: {
            weights: {
              _id: 9,
              tokenSerialNumber: 8,
              userId: 3,
              productId: 6,
              contractAddress: 5,
              walletAddress: 4,
              status: 1,
            },
            name: 'token_fulltext_search',
          },
        },
      ],
      { rebuild: true },
    );
  }

  await buildDbIndexes<TokenSurrogate>(TokenSurrogates, [
    {
      index: {
        tokenSerialNumber: 1,
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
