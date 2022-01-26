import { Collection } from '@unchainedshop/types/common';
import { AppleTransaction, PaymentModule } from '@unchainedshop/types/payments';
import { generateDbObjectId } from 'meteor/unchained:utils';

export const configureAppleTransactionsModule = (
  AppleTransactions: Collection<AppleTransaction>
): PaymentModule['appleTransactions'] => {
  return {
    findTransactions: async ({ transactionIdentifier }) => {
      return AppleTransactions.find({ transactionIdentifier }).toArray();
    },

    createTransaction: async (doc, userId) => {
      const transactionId = generateDbObjectId();

      await AppleTransactions.insertOne({
        _id: transactionId,
        ...doc,
        created: new Date(),
        createdBy: userId,
      });

      return transactionId;
    },
  };
};
