import { mongodb } from '@unchainedshop/mongodb';
import { SaferpayTransactionsCollection } from '../db/SaferpayTransactionsCollection.js';

export const configureSaferpayTransactionsModule = async ({ db }: { db: mongodb.Db }) => {
  const SaferpayTransactions = await SaferpayTransactionsCollection(db);

  return {
    findTransactionById: async (_id: mongodb.ObjectId) => {
      return SaferpayTransactions.findOne({
        _id,
      });
    },

    createTransaction: async (orderPaymentId) => {
      const result = await SaferpayTransactions.insertOne({
        created: new Date(),
        orderPaymentId,
      });
      return result.insertedId;
    },

    setToken: async (_id: mongodb.ObjectId, token: string) => {
      await SaferpayTransactions.updateOne(
        { _id },
        {
          $set: { token, updated: new Date() },
        },
      );
    },
  };
};

export type SaferpayTransactionsModule = Awaited<ReturnType<typeof configureSaferpayTransactionsModule>>;
