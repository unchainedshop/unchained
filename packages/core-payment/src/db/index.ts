import { sql, type DrizzleDb } from '@unchainedshop/store';

export {
  paymentProviders,
  paymentCredentials,
  PaymentProviderType,
  type PaymentProviderRow,
  type NewPaymentProviderRow,
  type PaymentCredentialsRow,
  type NewPaymentCredentialsRow,
} from './schema.ts';

/**
 * Initialize the payment tables and indexes in the database.
 * This should be called during database initialization.
 */
export async function initializePaymentSchema(db: DrizzleDb): Promise<void> {
  // Create the payment_providers table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS payment_providers (
      _id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      adapterKey TEXT NOT NULL,
      configuration TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes for payment_providers
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_payment_providers_type ON payment_providers(type)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_payment_providers_created ON payment_providers(created)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_payment_providers_deleted ON payment_providers(deleted)`,
  );

  // Create the payment_credentials table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS payment_credentials (
      _id TEXT PRIMARY KEY,
      paymentProviderId TEXT NOT NULL,
      userId TEXT NOT NULL,
      token TEXT,
      isPreferred INTEGER,
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Create indexes for payment_credentials
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_payment_credentials_paymentProviderId ON payment_credentials(paymentProviderId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_payment_credentials_userId ON payment_credentials(userId)`,
  );
}
