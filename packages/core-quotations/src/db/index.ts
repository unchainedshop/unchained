import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupQuotationsFTS } from './fts.ts';

export { quotations, QuotationStatus, type QuotationRow, type NewQuotationRow } from './schema.ts';

/**
 * Initialize the quotations table and indexes in the database.
 * This should be called during database initialization.
 */
export async function initializeQuotationsSchema(db: DrizzleDb): Promise<void> {
  // Create the quotations table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS quotations (
      _id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      productId TEXT NOT NULL,
      countryCode TEXT,
      currencyCode TEXT,
      quotationNumber TEXT,
      status TEXT,
      price INTEGER,
      expires INTEGER,
      fulfilled INTEGER,
      rejected INTEGER,
      configuration TEXT,
      context TEXT,
      meta TEXT,
      log TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_quotations_userId ON quotations(userId)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_quotations_productId ON quotations(productId)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status)`);

  // Setup FTS5 full-text search
  await setupQuotationsFTS(db);
}
