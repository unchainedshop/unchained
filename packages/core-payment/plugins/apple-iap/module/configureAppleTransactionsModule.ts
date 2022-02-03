import { Db } from '@unchainedshop/types/common';
import { generateDbObjectId } from 'meteor/unchained:utils';
import { AppleTransaction, AppleTransactionsCollection } from '../db/AppleTransactionsCollection';

export interface AppleTransactionsModule {
  findTransactions: (query: { transactionIdentifier: string }) => Promise<Array<AppleTransaction>>;

  createTransaction: (doc: AppleTransaction, userId: string) => Promise<string | null>;
}

export const configureAppleTransactionsModule = async ({
  db,
}: {
  db: Db;
}): Promise<AppleTransactionsModule> => {
  const AppleTransactions = await AppleTransactionsCollection(db);

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
