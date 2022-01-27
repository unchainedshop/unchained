import { Collection } from '@unchainedshop/types/common';
import { CryptopayTransaction, PaymentModule } from '@unchainedshop/types/payments';
import { generateDbObjectId } from 'meteor/unchained:utils';

export const configureCryptopayTransactionsModule = (
  CryptopayTransactions: Collection<CryptopayTransaction>,
): PaymentModule['cryptopayTransactions'] => {
  return {
    findTransactions: async ({ cryptoAddress }) => {
      return CryptopayTransactions.find({ cryptoAddress }).toArray();
    },

    createTransaction: async (doc, userId) => {
      const transactionId = generateDbObjectId();

      await CryptopayTransactions.insertOne({
        _id: transactionId,
        ...doc,
        created: new Date(),
        createdBy: userId,
      });

      return transactionId;
    },
  };
};
