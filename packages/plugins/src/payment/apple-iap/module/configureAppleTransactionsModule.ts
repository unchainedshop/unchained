import { AppleTransaction, AppleTransactionsCollection } from '../db/AppleTransactionsCollection.js';

export interface AppleTransactionsModule {
  findTransactionById: (transactionIdentifier: string) => Promise<AppleTransaction>;

  createTransaction: (doc: AppleTransaction, userId: string) => Promise<string | null>;
}

export const configureAppleTransactionsModule = async ({ db }): Promise<AppleTransactionsModule> => {
  const AppleTransactions = await AppleTransactionsCollection(db);

  return {
    findTransactionById: async (transactionIdentifier) => {
      return AppleTransactions.findOne({ _id: transactionIdentifier });
    },

    createTransaction: async (doc) => {
      await AppleTransactions.insertOne({
        ...doc,
        created: new Date(),
      });
      return doc._id;
    },
  };
};
