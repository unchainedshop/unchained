/**
 * @unchainedshop/store
 *
 * Drizzle ORM storage layer for Unchained Engine.
 * Provides database connection utilities for all Drizzle-based modules.
 */

import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import { sql } from 'drizzle-orm';

// Re-export Drizzle types that modules need
export { sql, eq, and, or, ne, lt, isNull, isNotNull, inArray, asc, desc } from 'drizzle-orm';
export type { SQL } from 'drizzle-orm';
export type { LibSQLDatabase } from 'drizzle-orm/libsql';

/**
 * Generic Drizzle database type.
 * Modules should use their own typed version with their schema.
 */
export type DrizzleDb = LibSQLDatabase<Record<string, unknown>>;

/**
 * Configuration for creating a Drizzle database connection.
 */
export interface DrizzleDbConfig {
  /**
   * Database URL.
   * Examples:
   * - "libsql://your-db.turso.io" (Turso cloud)
   * - "file:unchained.db" (local SQLite file)
   * - "file::memory:" (in-memory SQLite)
   */
  url: string;

  /**
   * Turso authentication token (required for remote databases).
   */
  authToken?: string;
}

/**
 * Database connection bundle with client access for cleanup.
 */
export interface DrizzleDbConnection {
  db: DrizzleDb;
  client: Client;
  close: () => void;
}

/**
 * Create a Drizzle database connection.
 */
export function createDrizzleDb(config: DrizzleDbConfig): DrizzleDbConnection {
  const client = createClient({
    url: config.url,
    authToken: config.authToken,
  });

  const db = drizzle(client);

  return {
    db,
    client,
    close: () => client.close(),
  };
}

/**
 * Create an in-memory database for testing.
 */
export function createTestDb(): DrizzleDbConnection {
  return createDrizzleDb({ url: 'file::memory:' });
}

/**
 * Initialize all module schemas in the database.
 * This should be called with schema initialization functions from each module.
 */
export async function initializeDrizzleDb(
  db: DrizzleDb,
  initializers: ((db: DrizzleDb) => Promise<void>)[],
): Promise<void> {
  for (const init of initializers) {
    await init(db);
  }
}

/**
 * Generate a unique ID compatible with MongoDB ObjectId format.
 * Produces a 24-character hexadecimal string (12 random bytes).
 */
export function generateId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Configuration for creating an FTS5 full-text search table.
 */
export interface FTSConfig {
  /**
   * Name of the FTS virtual table (e.g., 'countries_fts')
   */
  ftsTable: string;

  /**
   * Name of the source table to sync from (e.g., 'countries')
   */
  sourceTable: string;

  /**
   * Columns to include in the FTS index.
   * First column should be '_id' for lookups.
   */
  columns: string[];
}

/**
 * Create FTS5 full-text search helpers for a table.
 *
 * Returns setup and search functions that can be used by modules.
 *
 * @example
 * ```typescript
 * const countriesFTS = createFTS({
 *   ftsTable: 'countries_fts',
 *   sourceTable: 'countries',
 *   columns: ['_id', 'isoCode', 'defaultCurrencyCode']
 * });
 *
 * // In schema initialization:
 * await countriesFTS.setup(db);
 *
 * // In search:
 * const ids = await countriesFTS.search(db, 'switz');
 * ```
 */
export function createFTS(config: FTSConfig) {
  const { ftsTable, sourceTable, columns } = config;
  const columnList = columns.join(', ');
  const newColumnList = columns.map((c) => `NEW.${c}`).join(', ');

  return {
    /**
     * Setup the FTS5 virtual table and sync triggers.
     * Must be called after the source table is created.
     */
    setup: async (db: DrizzleDb): Promise<void> => {
      // Create FTS5 virtual table
      await db.run(
        sql.raw(`
        CREATE VIRTUAL TABLE IF NOT EXISTS ${ftsTable} USING fts5(
          ${columnList},
          tokenize="unicode61"
        )
      `),
      );

      // INSERT trigger - sync new rows to FTS
      await db.run(
        sql.raw(`
        CREATE TRIGGER IF NOT EXISTS ${sourceTable}_ai AFTER INSERT ON ${sourceTable} BEGIN
          INSERT INTO ${ftsTable} (${columnList})
          VALUES (${newColumnList});
        END
      `),
      );

      // DELETE trigger - remove deleted rows from FTS
      await db.run(
        sql.raw(`
        CREATE TRIGGER IF NOT EXISTS ${sourceTable}_ad AFTER DELETE ON ${sourceTable} BEGIN
          DELETE FROM ${ftsTable} WHERE _id = OLD._id;
        END
      `),
      );

      // UPDATE trigger - update FTS when row changes
      await db.run(
        sql.raw(`
        CREATE TRIGGER IF NOT EXISTS ${sourceTable}_au AFTER UPDATE ON ${sourceTable} BEGIN
          DELETE FROM ${ftsTable} WHERE _id = OLD._id;
          INSERT INTO ${ftsTable} (${columnList})
          VALUES (${newColumnList});
        END
      `),
      );
    },

    /**
     * Search using FTS5 full-text search.
     *
     * @param db - The database connection
     * @param searchText - The text to search for (prefix matching enabled)
     * @returns Array of matching _id values, ordered by relevance (BM25)
     */
    search: async (db: DrizzleDb, searchText: string): Promise<string[]> => {
      // Escape special FTS5 characters and add prefix matching
      const escapedSearch = searchText.replace(/[*"\\]/g, '');
      if (!escapedSearch.trim()) {
        return [];
      }

      const result = await db.all<{ _id: string }>(
        sql.raw(`
        SELECT _id FROM ${ftsTable}
        WHERE ${ftsTable} MATCH '"${escapedSearch}"*'
        ORDER BY bm25(${ftsTable})
      `),
      );

      return result.map((row) => row._id);
    },
  };
}
