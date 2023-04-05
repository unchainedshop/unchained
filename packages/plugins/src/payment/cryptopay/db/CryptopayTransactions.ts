import { TimestampFields } from '@unchainedshop/types/common.js';
import { mongodb } from '@unchainedshop/mongodb';

export type CryptopayTransaction = {
  _id?: string;
  blockHeight: number;
  mostRecentBlockHeight: number;
  amount: mongodb.Decimal128;
  currency: string;
  decimals: number;
  contract: string;
  orderPaymentId?: string;
} & TimestampFields;

export const CryptopayTransactionsCollection = (db: mongodb.Db) => {
  return db.collection<CryptopayTransaction>('cryptopay_transactions');
};
