import { AppleTransaction, AppleTransactionsCollection } from '../db/AppleTransactionsCollection.js';

export const configureAppleTransactionsModule = async ({ db }) => {
  const AppleTransactions = await AppleTransactionsCollection(db);

  return {
    findTransactionById: async (transactionIdentifier: string): Promise<AppleTransaction> => {
      return AppleTransactions.findOne({ _id: transactionIdentifier });
    },

    createTransaction: async (doc: AppleTransaction) => {
      await AppleTransactions.insertOne({
        ...doc,
        created: new Date(),
      });
      return doc._id;
    },
  };
};

export type AppleTransactionsModule = Awaited<ReturnType<typeof configureAppleTransactionsModule>>;
