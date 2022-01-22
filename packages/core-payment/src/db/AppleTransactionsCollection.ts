import { Db, _ID } from '@unchainedshop/types/common';
import { AppleTransaction } from '@unchainedshop/types/payments';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const AppleTransactionsCollection = async (db: Db) => {
  const AppleTransactions = db.collection<AppleTransaction>(
    'payment_apple_iap_processed_transactions'
  );

  await buildDbIndexes<AppleTransaction>(AppleTransactions, [
    { index: { transactionIdentifier: 1 } },
  ]);

  return AppleTransactions;
};
