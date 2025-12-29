import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupCurrenciesFTS } from './fts.ts';

export { currencies, type CurrencyRow, type NewCurrencyRow } from './schema.ts';

/**
 * Initialize the currencies table and FTS index in the database.
 * This should be called during database initialization.
 */
export async function initializeCurrenciesSchema(db: DrizzleDb): Promise<void> {
  // Create the currencies table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS currencies (
      _id TEXT PRIMARY KEY,
      isoCode TEXT NOT NULL UNIQUE,
      isActive INTEGER,
      contractAddress TEXT,
      decimals INTEGER,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_currencies_deleted ON currencies(deleted)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_currencies_isActive ON currencies(isActive)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_currencies_contractAddress ON currencies(contractAddress)
  `);

  // Setup FTS5 full-text search
  await setupCurrenciesFTS(db);
}
