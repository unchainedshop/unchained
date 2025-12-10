import { generateDbObjectId } from '@unchainedshop/mongodb';
import { type AppleTransaction, AppleTransactionsCollection } from './db/AppleTransactionsCollection.ts';

export const configureAppleTransactionsModule = async ({ db }) => {
  const AppleTransactions = await AppleTransactionsCollection(db);

  return {
    findTransactionById: async (transactionIdentifier: string): Promise<AppleTransaction | null> => {
      return AppleTransactions.findOne({ _id: transactionIdentifier });
    },

    createTransaction: async (
      doc: Omit<AppleTransaction, '_id' | 'created'> &
        Pick<Partial<AppleTransaction>, '_id' | 'created'>,
    ) => {
      const { insertedId } = await AppleTransactions.insertOne({
        _id: generateDbObjectId(),
        ...doc,
        created: new Date(),
      });
      return insertedId;
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
