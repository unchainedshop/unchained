import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupLanguagesFTS } from './fts.ts';

export { languages, type LanguageRow, type NewLanguageRow } from './schema.ts';

/**
 * Initialize the languages table and FTS index in the database.
 * This should be called during database initialization.
 */
export async function initializeLanguagesSchema(db: DrizzleDb): Promise<void> {
  // Create the languages table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS languages (
      _id TEXT PRIMARY KEY,
      isoCode TEXT NOT NULL UNIQUE,
      isActive INTEGER,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_languages_deleted ON languages(deleted)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_languages_isActive ON languages(isActive)
  `);

  // Setup FTS5 full-text search
  await setupLanguagesFTS(db);
}
