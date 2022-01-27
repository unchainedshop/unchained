import { Db } from '@unchainedshop/types/common';
import { CryptopayTransaction } from '@unchainedshop/types/payments';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const CryptopayCollection = async (db: Db) => {
  const CryptopayTransactions = db.collection<CryptopayTransaction>('payment_cryptopay_processed_transactions');

  await buildDbIndexes<CryptopayTransaction>(CryptopayTransactions, [{ index: { cryptoAddress: 1 } }]);

  return CryptopayTransactions;
};
