import { sql, type DrizzleDb } from '@unchainedshop/store';

export { mediaObjects, type MediaObjectRow, type NewMediaObjectRow } from './schema.ts';

/**
 * Initialize the media objects table and indexes in the database.
 * This should be called during database initialization.
 */
export async function initializeFilesSchema(db: DrizzleDb): Promise<void> {
  // Create the media_objects table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS media_objects (
      _id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER,
      type TEXT,
      url TEXT,
      expires INTEGER,
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_media_objects_url ON media_objects(url)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_media_objects_expires ON media_objects(expires)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_media_objects_created ON media_objects(created)`);
}
