import { mongodb } from '@unchainedshop/mongodb';
import { TimestampFields } from '@unchainedshop/types/common.js';

export type SaferpayTransaction = {
  orderPaymentId: any;
  token?: string;
} & TimestampFields;

export const SaferpayTransactionsCollection = async (db: mongodb.Db) => {
  const SaferpayTransactions = db.collection<SaferpayTransaction>('payment_saferpay_transactions');

  return SaferpayTransactions;
};
