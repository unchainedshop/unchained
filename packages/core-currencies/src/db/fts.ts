import { sql, type DrizzleDb } from '@unchainedshop/store';

/**
 * Setup FTS5 full-text search for the currencies table.
 * Creates a virtual FTS5 table and triggers to keep it in sync.
 *
 * Must be called after the main currencies table is created.
 */
export async function setupCurrenciesFTS(db: DrizzleDb): Promise<void> {
  // Create FTS5 virtual table
  await db.run(sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS currencies_fts USING fts5(
      _id,
      isoCode,
      contractAddress,
      tokenize="unicode61"
    )
  `);

  // INSERT trigger - sync new rows to FTS
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS currencies_ai AFTER INSERT ON currencies BEGIN
      INSERT INTO currencies_fts (_id, isoCode, contractAddress)
      VALUES (NEW._id, NEW.isoCode, NEW.contractAddress);
    END
  `);

  // DELETE trigger - remove deleted rows from FTS
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS currencies_ad AFTER DELETE ON currencies BEGIN
      DELETE FROM currencies_fts WHERE _id = OLD._id;
    END
  `);

  // UPDATE trigger - update FTS when row changes
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS currencies_au AFTER UPDATE ON currencies BEGIN
      DELETE FROM currencies_fts WHERE _id = OLD._id;
      INSERT INTO currencies_fts (_id, isoCode, contractAddress)
      VALUES (NEW._id, NEW.isoCode, NEW.contractAddress);
    END
  `);
}

/**
 * Search currencies using FTS5 full-text search.
 *
 * @param db - The database connection
 * @param searchText - The text to search for
 * @returns Array of matching currency IDs, ordered by relevance (BM25)
 */
export async function searchCurrenciesFTS(db: DrizzleDb, searchText: string): Promise<string[]> {
  // Escape special FTS5 characters and add prefix matching
  const escapedSearch = searchText.replace(/[*"\\]/g, '');
  if (!escapedSearch.trim()) {
    return [];
  }

  const result = await db.all<{ _id: string }>(sql`
    SELECT _id FROM currencies_fts
    WHERE currencies_fts MATCH ${`"${escapedSearch}"*`}
    ORDER BY bm25(currencies_fts)
  `);

  return result.map((row) => row._id);
}
