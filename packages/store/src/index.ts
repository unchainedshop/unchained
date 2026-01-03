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
export {
  sql,
  eq,
  and,
  or,
  ne,
  lt,
  gt,
  lte,
  gte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  like,
  asc,
  desc,
  count,
} from 'drizzle-orm';
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
 * Counter for generating unique IDs within the same second.
 * Initialized with a cryptographically random value to avoid collisions across processes.
 */
const counterBytes = crypto.getRandomValues(new Uint8Array(3));
let idCounter = (counterBytes[0] << 16) | (counterBytes[1] << 8) | counterBytes[2];

/**
 * Random 5-byte value generated once per process.
 * Used to ensure uniqueness across different machines/processes.
 */
const processRandom = crypto.getRandomValues(new Uint8Array(5));

/**
 * Generate a unique ID compatible with MongoDB ObjectId format.
 * Produces a 24-character hexadecimal string (12 bytes) that is:
 * - Sortable by insertion time (first 4 bytes are Unix timestamp)
 * - Unique across processes (5 random bytes per process)
 * - Unique within process (3-byte incrementing counter)
 *
 * Structure (12 bytes = 24 hex chars):
 * - Bytes 0-3: Unix timestamp in seconds (big-endian)
 * - Bytes 4-8: Process-unique random value
 * - Bytes 9-11: Incrementing counter (big-endian)
 */
export function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  idCounter = (idCounter + 1) % 0xffffff;

  const buffer = new Uint8Array(12);

  // Bytes 0-3: timestamp (big-endian)
  buffer[0] = (timestamp >> 24) & 0xff;
  buffer[1] = (timestamp >> 16) & 0xff;
  buffer[2] = (timestamp >> 8) & 0xff;
  buffer[3] = timestamp & 0xff;

  // Bytes 4-8: process random
  buffer.set(processRandom, 4);

  // Bytes 9-11: counter (big-endian)
  buffer[9] = (idCounter >> 16) & 0xff;
  buffer[10] = (idCounter >> 8) & 0xff;
  buffer[11] = idCounter & 0xff;

  return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build a partial column selection for Drizzle queries.
 * Used to avoid over-fetching by selecting only requested fields.
 *
 * @param columns - The full COLUMNS map for the table
 * @param fields - Optional array of field names to select
 * @returns Partial column map for db.select(), or undefined for full select
 *
 * @example
 * ```typescript
 * const COLUMNS = { _id: table._id, name: table.name, ... } as const;
 * const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
 * const query = selectColumns
 *   ? db.select(selectColumns).from(table)
 *   : db.select().from(table);
 * ```
 */
export function buildSelectColumns<T extends Record<string, unknown>>(
  columns: T,
  fields?: (keyof T)[],
): Partial<T> | undefined {
  if (!fields?.length) return undefined;
  return Object.fromEntries(fields.map((field) => [field, columns[field]])) as Partial<T>;
}

/**
 * Configuration for creating an FTS5 full-text search table.
 *
 * @deprecated Use the FTS5 search plugin (@unchainedshop/plugins/search/fts5-search)
 * for full-text search functionality instead. This helper creates trigger-based
 * FTS sync which is being replaced by event-driven indexing.
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
 * @deprecated Use the FTS5 search plugin (@unchainedshop/plugins/search/fts5-search)
 * for full-text search functionality instead. This helper creates trigger-based
 * FTS sync which is being replaced by event-driven indexing.
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
      // Use secure FTS5 escaping to prevent SQL injection
      const { escapeFTS5WithPrefix } = await import('@unchainedshop/utils');
      const safeQuery = escapeFTS5WithPrefix(searchText);

      if (!safeQuery) {
        return [];
      }

      const result = await db.all<{ _id: string }>(
        sql.raw(`
        SELECT _id FROM ${ftsTable}
        WHERE ${ftsTable} MATCH '${safeQuery}'
        ORDER BY bm25(${ftsTable})
      `),
      );

      return result.map((row) => row._id);
    },
  };
}
