import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupCountriesFTS } from './fts.ts';

export { countries, type CountryRow, type NewCountryRow } from './schema.ts';

/**
 * Initialize the countries table and FTS index in the database.
 * This should be called during database initialization.
 */
export async function initializeCountriesSchema(db: DrizzleDb): Promise<void> {
  // Create the countries table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS countries (
      _id TEXT PRIMARY KEY,
      isoCode TEXT NOT NULL UNIQUE,
      isActive INTEGER,
      defaultCurrencyCode TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_countries_deleted ON countries(deleted)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_countries_isActive ON countries(isActive)
  `);

  // Setup FTS5 full-text search
  await setupCountriesFTS(db);
}
