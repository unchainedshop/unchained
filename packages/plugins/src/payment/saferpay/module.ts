import { sql, type DrizzleDb, generateId } from '@unchainedshop/store';
import { eq } from 'drizzle-orm';
import { saferpayTransactions, type SaferpayTransaction } from './db/schema.ts';

export async function initializeSaferpaySchema(db: DrizzleDb): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS payment_saferpay_transactions (
      _id TEXT PRIMARY KEY,
      orderPaymentId TEXT NOT NULL,
      token TEXT,
      created INTEGER,
      updated INTEGER
    )
  `);

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_saferpay_transactions_orderPaymentId
    ON payment_saferpay_transactions(orderPaymentId)
  `);
}

const configureSaferpayTransactionsModule = async ({ db }: { db: DrizzleDb }) => {
  // Initialize schema on first configure
  await initializeSaferpaySchema(db);

  return {
    findTransactionById: async (_id: string): Promise<SaferpayTransaction | null> => {
      const result = await db
        .select()
        .from(saferpayTransactions)
        .where(eq(saferpayTransactions._id, _id))
        .limit(1);
      return result[0] || null;
    },

    createTransaction: async (orderPaymentId: string): Promise<string> => {
      const _id = generateId();
      await db.insert(saferpayTransactions).values({
        _id,
        orderPaymentId,
        created: new Date(),
      });
      return _id;
    },

    setToken: async (_id: string, token: string): Promise<void> => {
      await db
        .update(saferpayTransactions)
        .set({ token, updated: new Date() })
        .where(eq(saferpayTransactions._id, _id));
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
