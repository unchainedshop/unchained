/**
 * @unchainedshop/store
 *
 * Drizzle ORM storage layer for Unchained Engine.
 * Provides database connection utilities for all Drizzle-based modules.
 */

import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';

// Re-export Drizzle types that modules need
export { sql, eq, and, or, isNull, isNotNull, inArray, asc, desc } from 'drizzle-orm';
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
