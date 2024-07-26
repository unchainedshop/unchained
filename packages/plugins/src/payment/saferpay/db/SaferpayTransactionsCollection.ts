import { mongodb } from '@unchainedshop/mongodb';
import type { TimestampFields } from '@unchainedshop/mongodb';

export type SaferpayTransaction = {
  orderPaymentId: any;
  token?: string;
} & TimestampFields;

export const SaferpayTransactionsCollection = async (db: mongodb.Db) => {
  const SaferpayTransactions = db.collection<SaferpayTransaction>('payment_saferpay_transactions');

  return SaferpayTransactions;
};
