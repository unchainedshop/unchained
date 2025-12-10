import { mongodb } from '@unchainedshop/mongodb';
import { SaferpayTransactionsCollection } from './db/SaferpayTransactionsCollection.ts';

const configureSaferpayTransactionsModule = async ({ db }: { db: mongodb.Db }) => {
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

export default {
  saferpayTransactions: {
    configure: configureSaferpayTransactionsModule,
  },
};

export interface SaferpayTransactionsModule {
  saferpayTransactions: Awaited<ReturnType<typeof configureSaferpayTransactionsModule>>;
}
