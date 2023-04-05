import { mongodb } from '@unchainedshop/mongodb';
import { TimestampFields, _ID } from '@unchainedshop/types/common.js';

export type AppleTransaction = {
  _id?: _ID;
  matchedTransaction: any;
  orderId: string;
} & TimestampFields;

export const AppleTransactionsCollection = async (db: mongodb.Db) => {
  const AppleTransactions = db.collection<AppleTransaction>('payment_apple_iap_processed_transactions');

  return AppleTransactions;
};
