import { Db, TimestampFields, _ID } from '@unchainedshop/types/common';

export type AppleTransaction = {
  _id?: _ID;
  matchedTransaction: any;
  orderId: string;
} & TimestampFields;

export const AppleTransactionsCollection = async (db: Db) => {
  const AppleTransactions = db.collection<AppleTransaction>('payment_apple_iap_processed_transactions');

  return AppleTransactions;
};
