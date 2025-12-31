import { sql, type DrizzleDb } from '@unchainedshop/store';
import { eq } from 'drizzle-orm';
import { cryptopayTransactions, type CryptopayTransaction } from './db/schema.ts';

export async function initializeCryptopaySchema(db: DrizzleDb): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS cryptopay_transactions (
      _id TEXT PRIMARY KEY,
      blockHeight INTEGER NOT NULL DEFAULT 0,
      mostRecentBlockHeight INTEGER NOT NULL DEFAULT 0,
      amount TEXT NOT NULL DEFAULT '0',
      currencyCode TEXT NOT NULL,
      decimals INTEGER,
      orderPaymentId TEXT,
      created INTEGER,
      updated INTEGER
    )
  `);

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_cryptopay_transactions_orderPaymentId
    ON cryptopay_transactions(orderPaymentId)
  `);

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_cryptopay_transactions_currencyCode
    ON cryptopay_transactions(currencyCode)
  `);
}

const configureCryptopayModule = async ({ db }: { db: DrizzleDb }) => {
  // Initialize schema on first configure
  await initializeCryptopaySchema(db);
  const getWalletAddress = async (
    address: string,
    contract?: string,
  ): Promise<CryptopayTransaction | null> => {
    const addressId = [address, contract].filter(Boolean).join(':');
    const result = await db
      .select()
      .from(cryptopayTransactions)
      .where(eq(cryptopayTransactions._id, addressId))
      .limit(1);
    return result[0] || null;
  };

  const updateMostRecentBlock = async (currencyCode: string, blockHeight: number): Promise<void> => {
    await db
      .update(cryptopayTransactions)
      .set({
        mostRecentBlockHeight: blockHeight,
      })
      .where(eq(cryptopayTransactions.currencyCode, currencyCode));
  };

  const mapOrderPaymentToWalletAddress = async ({
    address,
    contract,
    currencyCode,
    orderPaymentId,
  }: {
    address: string;
    contract?: string;
    currencyCode: string;
    orderPaymentId: string;
  }): Promise<CryptopayTransaction> => {
    const addressId = [address, contract].filter(Boolean).join(':');
    const now = new Date();

    // Try to find existing
    const existing = await db
      .select()
      .from(cryptopayTransactions)
      .where(eq(cryptopayTransactions._id, addressId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(cryptopayTransactions)
        .set({
          orderPaymentId,
          updated: now,
        })
        .where(eq(cryptopayTransactions._id, addressId));

      const updated = await db
        .select()
        .from(cryptopayTransactions)
        .where(eq(cryptopayTransactions._id, addressId))
        .limit(1);
      return updated[0];
    }

    // Insert new
    await db.insert(cryptopayTransactions).values({
      _id: addressId,
      currencyCode,
      mostRecentBlockHeight: 0,
      blockHeight: 0,
      amount: '0',
      orderPaymentId,
      created: now,
      updated: now,
    });

    const inserted = await db
      .select()
      .from(cryptopayTransactions)
      .where(eq(cryptopayTransactions._id, addressId))
      .limit(1);
    return inserted[0];
  };

  const getNextDerivationNumber = async (currencyCode: string): Promise<number> => {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(cryptopayTransactions)
      .where(eq(cryptopayTransactions.currencyCode, currencyCode));
    return (result[0]?.count ?? 0) + 1;
  };

  const getWalletAddressesByOrderPaymentId = async (
    orderPaymentId: string,
  ): Promise<CryptopayTransaction[]> => {
    return db
      .select()
      .from(cryptopayTransactions)
      .where(eq(cryptopayTransactions.orderPaymentId, orderPaymentId))
      .orderBy(cryptopayTransactions.created);
  };

  const updateWalletAddress = async ({
    address,
    blockHeight,
    amount,
    contract,
    currencyCode,
    decimals,
  }: {
    address: string;
    blockHeight: number;
    amount: string | number;
    contract?: string;
    currencyCode: string;
    decimals: number;
  }): Promise<CryptopayTransaction> => {
    const addressId = [address, contract].filter(Boolean).join(':');
    const now = new Date();
    const amountStr = typeof amount === 'number' ? `${amount}` : amount;

    // Try to find existing
    const existing = await db
      .select()
      .from(cryptopayTransactions)
      .where(eq(cryptopayTransactions._id, addressId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(cryptopayTransactions)
        .set({
          currencyCode,
          decimals,
          blockHeight,
          mostRecentBlockHeight: blockHeight,
          amount: amountStr,
          updated: now,
        })
        .where(eq(cryptopayTransactions._id, addressId));
    } else {
      await db.insert(cryptopayTransactions).values({
        _id: addressId,
        currencyCode,
        decimals,
        blockHeight,
        mostRecentBlockHeight: blockHeight,
        amount: amountStr,
        created: now,
        updated: now,
      });
    }

    const result = await db
      .select()
      .from(cryptopayTransactions)
      .where(eq(cryptopayTransactions._id, addressId))
      .limit(1);
    return result[0];
  };

  return {
    getWalletAddress,
    updateMostRecentBlock,
    updateWalletAddress,
    mapOrderPaymentToWalletAddress,
    getNextDerivationNumber,
    getWalletAddressesByOrderPaymentId,
  };
};

export default {
  cryptopay: {
    configure: configureCryptopayModule,
  },
};

export interface CryptopayModule {
  cryptopay: Awaited<ReturnType<typeof configureCryptopayModule>>;
}
