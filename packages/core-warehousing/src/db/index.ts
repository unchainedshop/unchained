import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupTokenSurrogatesFTS } from './fts.ts';

export {
  warehousingProviders,
  tokenSurrogates,
  WarehousingProviderType,
  TokenStatus,
  type WarehousingProviderRow,
  type NewWarehousingProviderRow,
  type TokenSurrogateRow,
  type NewTokenSurrogateRow,
} from './schema.ts';

/**
 * Initialize the warehousing tables and indexes in the database.
 * This should be called during database initialization.
 */
export async function initializeWarehousingSchema(db: DrizzleDb): Promise<void> {
  // Create the warehousing_providers table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS warehousing_providers (
      _id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      adapterKey TEXT NOT NULL,
      configuration TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes for warehousing_providers
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_warehousing_providers_type ON warehousing_providers(type)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_warehousing_providers_created ON warehousing_providers(created)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_warehousing_providers_deleted ON warehousing_providers(deleted)`,
  );

  // Create the token_surrogates table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS token_surrogates (
      _id TEXT PRIMARY KEY,
      userId TEXT,
      walletAddress TEXT,
      invalidatedDate INTEGER,
      expiryDate INTEGER,
      quantity INTEGER NOT NULL,
      contractAddress TEXT,
      chainId TEXT,
      tokenSerialNumber TEXT NOT NULL,
      productId TEXT NOT NULL,
      orderPositionId TEXT NOT NULL,
      meta TEXT
    )
  `);

  // Create indexes for token_surrogates
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_token_surrogates_userId ON token_surrogates(userId)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_token_surrogates_productId ON token_surrogates(productId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_token_surrogates_orderPositionId ON token_surrogates(orderPositionId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_token_surrogates_tokenSerialNumber ON token_surrogates(tokenSerialNumber)`,
  );

  // Setup FTS5 full-text search for token surrogates
  await setupTokenSurrogatesFTS(db);
}
