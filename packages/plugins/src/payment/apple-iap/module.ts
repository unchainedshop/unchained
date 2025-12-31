import { sql, type DrizzleDb, generateId } from '@unchainedshop/store';
import { eq } from 'drizzle-orm';
import { appleTransactions, type AppleTransaction } from './db/schema.ts';

export async function initializeAppleIapSchema(db: DrizzleDb): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS payment_apple_iap_processed_transactions (
      _id TEXT PRIMARY KEY,
      matchedTransaction TEXT,
      orderId TEXT NOT NULL,
      created INTEGER,
      updated INTEGER
    )
  `);

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_apple_iap_transactions_orderId
    ON payment_apple_iap_processed_transactions(orderId)
  `);
}

export const configureAppleTransactionsModule = async ({ db }: { db: DrizzleDb }) => {
  // Initialize schema on first configure
  await initializeAppleIapSchema(db);

  return {
    findTransactionById: async (transactionIdentifier: string): Promise<AppleTransaction | null> => {
      const result = await db
        .select()
        .from(appleTransactions)
        .where(eq(appleTransactions._id, transactionIdentifier))
        .limit(1);
      return result[0] || null;
    },

    createTransaction: async (doc: {
      _id?: string;
      matchedTransaction: any;
      orderId: string;
    }): Promise<string> => {
      const _id = doc._id || generateId();
      await db.insert(appleTransactions).values({
        _id,
        matchedTransaction: doc.matchedTransaction,
        orderId: doc.orderId,
        created: new Date(),
      });
      return _id;
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
