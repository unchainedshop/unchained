import { sql, type DrizzleDb } from '@unchainedshop/store';

/**
 * Setup FTS5 full-text search for the languages table.
 * Creates a virtual FTS5 table and triggers to keep it in sync.
 *
 * Must be called after the main languages table is created.
 */
export async function setupLanguagesFTS(db: DrizzleDb): Promise<void> {
  // Create FTS5 virtual table
  await db.run(sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS languages_fts USING fts5(
      _id,
      isoCode,
      tokenize="unicode61"
    )
  `);

  // INSERT trigger - sync new rows to FTS
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS languages_ai AFTER INSERT ON languages BEGIN
      INSERT INTO languages_fts (_id, isoCode)
      VALUES (NEW._id, NEW.isoCode);
    END
  `);

  // DELETE trigger - remove deleted rows from FTS
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS languages_ad AFTER DELETE ON languages BEGIN
      DELETE FROM languages_fts WHERE _id = OLD._id;
    END
  `);

  // UPDATE trigger - update FTS when row changes
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS languages_au AFTER UPDATE ON languages BEGIN
      DELETE FROM languages_fts WHERE _id = OLD._id;
      INSERT INTO languages_fts (_id, isoCode)
      VALUES (NEW._id, NEW.isoCode);
    END
  `);
}

/**
 * Search languages using FTS5 full-text search.
 *
 * @param db - The database connection
 * @param searchText - The text to search for
 * @returns Array of matching language IDs, ordered by relevance (BM25)
 */
export async function searchLanguagesFTS(db: DrizzleDb, searchText: string): Promise<string[]> {
  // Escape special FTS5 characters and add prefix matching
  const escapedSearch = searchText.replace(/[*"\\]/g, '');
  if (!escapedSearch.trim()) {
    return [];
  }

  const result = await db.all<{ _id: string }>(sql`
    SELECT _id FROM languages_fts
    WHERE languages_fts MATCH ${`"${escapedSearch}"*`}
    ORDER BY bm25(languages_fts)
  `);

  return result.map((row) => row._id);
}
