import { sql, type DrizzleDb } from '@unchainedshop/store';

/**
 * Setup FTS5 full-text search for the countries table.
 * Creates a virtual FTS5 table and triggers to keep it in sync.
 *
 * Must be called after the main countries table is created.
 */
export async function setupCountriesFTS(db: DrizzleDb): Promise<void> {
  // Create FTS5 virtual table
  await db.run(sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS countries_fts USING fts5(
      _id,
      isoCode,
      defaultCurrencyCode,
      tokenize="unicode61"
    )
  `);

  // INSERT trigger - sync new rows to FTS
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS countries_ai AFTER INSERT ON countries BEGIN
      INSERT INTO countries_fts (_id, isoCode, defaultCurrencyCode)
      VALUES (NEW._id, NEW.isoCode, NEW.defaultCurrencyCode);
    END
  `);

  // DELETE trigger - remove deleted rows from FTS
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS countries_ad AFTER DELETE ON countries BEGIN
      DELETE FROM countries_fts WHERE _id = OLD._id;
    END
  `);

  // UPDATE trigger - update FTS when row changes
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS countries_au AFTER UPDATE ON countries BEGIN
      DELETE FROM countries_fts WHERE _id = OLD._id;
      INSERT INTO countries_fts (_id, isoCode, defaultCurrencyCode)
      VALUES (NEW._id, NEW.isoCode, NEW.defaultCurrencyCode);
    END
  `);
}

/**
 * Search countries using FTS5 full-text search.
 *
 * @param db - The database connection
 * @param searchText - The text to search for
 * @returns Array of matching country IDs, ordered by relevance (BM25)
 */
export async function searchCountriesFTS(db: DrizzleDb, searchText: string): Promise<string[]> {
  // Escape special FTS5 characters and add prefix matching
  const escapedSearch = searchText.replace(/[*"\\]/g, '');
  if (!escapedSearch.trim()) {
    return [];
  }

  const result = await db.all<{ _id: string }>(sql`
    SELECT _id FROM countries_fts
    WHERE countries_fts MATCH ${`"${escapedSearch}"*`}
    ORDER BY bm25(countries_fts)
  `);

  return result.map((row) => row._id);
}
