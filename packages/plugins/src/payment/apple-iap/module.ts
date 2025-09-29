import { generateDbObjectId } from '@unchainedshop/mongodb';
import { AppleTransaction, AppleTransactionsCollection } from './db/AppleTransactionsCollection.js';

export const configureAppleTransactionsModule = async ({ db }) => {
  const AppleTransactions = await AppleTransactionsCollection(db);

  return {
    findTransactionById: async (transactionIdentifier: string): Promise<AppleTransaction> => {
      return AppleTransactions.findOne({ _id: transactionIdentifier });
    },

    createTransaction: async (
      doc: Omit<AppleTransaction, '_id' | 'created'> &
        Pick<Partial<AppleTransaction>, '_id' | 'created'>,
    ) => {
      await AppleTransactions.insertOne({
        _id: generateDbObjectId(),
        ...doc,
        created: new Date(),
      });
      return doc._id;
    },
  };
};

export default {
  appleTransactions: {
    configure: configureAppleTransactionsModule,
  },
};

export interface AppleTransactionsModule {
  appleTransactions: Awaited<ReturnType<typeof configureAppleTransactionsModule>>;
}
