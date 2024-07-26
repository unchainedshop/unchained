import { mongodb } from '@unchainedshop/mongodb';
import type { TimestampFields } from '@unchainedshop/mongodb';

export type AppleTransaction = {
  _id?: string;
  matchedTransaction: any;
  orderId: string;
} & TimestampFields;

export const AppleTransactionsCollection = async (db: mongodb.Db) => {
  const AppleTransactions = db.collection<AppleTransaction>('payment_apple_iap_processed_transactions');

  return AppleTransactions;
};
