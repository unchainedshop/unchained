import { buildDbIndexes, mongodb } from '@unchainedshop/mongodb';
import { type TimestampFields } from '@unchainedshop/mongodb';

export type CryptopayTransaction = {
  _id: string;
  blockHeight: number;
  mostRecentBlockHeight: number;
  amount: mongodb.Decimal128;
  currencyCode: string;
  decimals: number;
  orderPaymentId?: string;
} & TimestampFields;

export const CryptopayTransactionsCollection = async (db: mongodb.Db) => {
  const CryptopayTransactions = db.collection<CryptopayTransaction>('cryptopay_transactions');

  await buildDbIndexes<CryptopayTransaction>(CryptopayTransactions, [
    { index: { currencyCode: 1 } },
    { index: { orderPaymentId: 1 }, options: { sparse: true } },
  ]);

  return CryptopayTransactions;
};
