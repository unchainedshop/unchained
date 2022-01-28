import { Db, TimestampFields, _ID } from "@unchainedshop/types/common";
import { buildDbIndexes } from "meteor/unchained:utils";

export type AppleTransaction = {
  _id?: _ID;
  transactionIdentifier: string;
  matchedTransaction: any;
  orderId: string;
} & TimestampFields;

export const AppleTransactionsCollection = async (db: Db) => {
  const AppleTransactions = db.collection<AppleTransaction>(
    "payment_apple_iap_processed_transactions"
  );

  await buildDbIndexes<AppleTransaction>(AppleTransactions, [
    { index: { transactionIdentifier: 1 } },
  ]);

  return AppleTransactions;
};
