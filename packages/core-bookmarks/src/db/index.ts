import { sql, type DrizzleDb } from '@unchainedshop/store';

export { bookmarks, type BookmarkRow, type NewBookmarkRow } from './schema.ts';

/**
 * Initialize the bookmarks table in the database.
 * This should be called during database initialization.
 */
export async function initializeBookmarksSchema(db: DrizzleDb): Promise<void> {
  // Create the bookmarks table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS bookmarks (
      _id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      productId TEXT NOT NULL,
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_userId ON bookmarks(userId)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_productId ON bookmarks(productId)
  `);
}
