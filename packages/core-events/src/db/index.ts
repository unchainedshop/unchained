import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupEventsFTS } from './fts.ts';

export { events, type EventRow, type NewEventRow } from './schema.ts';

/**
 * Initialize the events table and FTS index in the database.
 * This should be called during database initialization.
 */
export async function initializeEventsSchema(db: DrizzleDb): Promise<void> {
  // Create the events table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS events (
      _id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      context TEXT,
      payload TEXT,
      created INTEGER NOT NULL
    )
  `);

  // Create indexes
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created)
  `);

  // Setup FTS5 full-text search
  await setupEventsFTS(db);
}
