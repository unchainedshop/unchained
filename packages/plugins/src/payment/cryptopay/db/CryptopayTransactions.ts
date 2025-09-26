import { mongodb } from '@unchainedshop/mongodb';
import { TimestampFields } from '@unchainedshop/mongodb';

export type CryptopayTransaction = {
  _id: string;
  blockHeight: number;
  mostRecentBlockHeight: number;
  amount: mongodb.Decimal128;
  currencyCode: string;
  decimals: number;
  orderPaymentId?: string;
} & TimestampFields;

export const CryptopayTransactionsCollection = (db: mongodb.Db) => {
  return db.collection<CryptopayTransaction>('cryptopay_transactions');
};
