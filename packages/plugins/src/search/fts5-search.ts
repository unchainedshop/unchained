/**
 * FTS5 Full-Text Search Plugin
 *
 * Self-contained SQLite FTS5 search implementation.
 * Uses its own database connection, separate from core.
 *
 * Usage:
 *   import { initializeFTS5Search, setupFTS5Tables } from '@unchainedshop/plugins/search/fts5-search';
 *
 *   // During app initialization:
 *   await setupFTS5Tables(dbUrl, authToken);
 *   initializeFTS5Search();
 */

import {
  SearchDirector,
  SearchAdapter,
  type ISearchAdapter,
  type SearchContext,
} from '@unchainedshop/core';
import { createDrizzleDb, sql, type DrizzleDb } from '@unchainedshop/store';
import { escapeFTS5WithPrefix } from '@unchainedshop/utils';

// Plugin's own database connection (not shared with core)
let ftsDb: DrizzleDb | null = null;
let ftsDbClose: (() => void) | null = null;

// FTS Table definitions - all tables in one place
interface FTSTableConfig {
  table: string;
  columns: string[];
  idColumn?: string; // Column to return as ID (defaults to '_id')
}

const FTS_TABLES: Record<string, FTSTableConfig> = {
  // Products
  products: {
    table: 'products_fts',
    columns: ['_id UNINDEXED', 'sku', 'slugs_text'],
  },
  product_texts: {
    table: 'product_texts_fts',
    columns: [
      '_id UNINDEXED',
      'productId UNINDEXED',
      'title',
      'subtitle',
      'brand',
      'vendor',
      'description',
      'labels',
      'slug',
    ],
    idColumn: 'productId',
  },
  product_reviews: {
    table: 'product_reviews_fts',
    columns: ['_id UNINDEXED', 'productId UNINDEXED', 'title', 'review'],
    idColumn: 'productId',
  },

  // Assortments
  assortments: {
    table: 'assortments_fts',
    columns: ['_id', 'slugs_text'],
  },
  assortment_texts: {
    table: 'assortment_texts_fts',
    columns: ['_id', 'assortmentId', 'title', 'subtitle'],
    idColumn: 'assortmentId',
  },

  // Orders
  orders: {
    table: 'orders_fts',
    columns: ['_id UNINDEXED', 'userId', 'orderNumber', 'status', 'emailAddress', 'telNumber'],
  },

  // Users
  users: {
    table: 'users_fts',
    columns: ['_id', 'username'],
  },

  // Quotations
  quotations: {
    table: 'quotations_fts',
    columns: ['_id', 'userId', 'quotationNumber', 'status'],
  },

  // Enrollments
  enrollments: {
    table: 'enrollments_fts',
    columns: ['_id', 'userId', 'enrollmentNumber', 'status'],
  },

  // Filters
  filters: {
    table: 'filters_fts',
    columns: ['_id', 'key', 'options'],
  },
  filter_texts: {
    table: 'filter_texts_fts',
    columns: ['_id', 'filterId', 'title', 'subtitle'],
    idColumn: 'filterId',
  },

  // Reference data
  countries: {
    table: 'countries_fts',
    columns: ['_id', 'isoCode', 'defaultCurrencyCode'],
  },
  currencies: {
    table: 'currencies_fts',
    columns: ['_id', 'isoCode', 'contractAddress'],
  },
  languages: {
    table: 'languages_fts',
    columns: ['_id', 'isoCode'],
  },

  // Events
  events: {
    table: 'events_fts',
    columns: ['_id', 'type'],
  },

  // Worker
  work_queue: {
    table: 'work_queue_fts',
    columns: ['_id', 'originalWorkId', 'type', 'worker', 'input'],
  },

  // Warehousing
  token_surrogates: {
    table: 'token_surrogates_fts',
    columns: ['_id', 'tokenSerialNumber', 'userId', 'productId', 'contractAddress', 'walletAddress'],
  },

  // Providers
  delivery_providers: {
    table: 'delivery_providers_fts',
    columns: ['_id', 'type', 'adapterKey'],
  },
  payment_providers: {
    table: 'payment_providers_fts',
    columns: ['_id', 'type', 'adapterKey'],
  },
  warehousing_providers: {
    table: 'warehousing_providers_fts',
    columns: ['_id', 'type', 'adapterKey'],
  },
};

/**
 * Setup all FTS5 tables in the plugin's own database.
 * Must be called during app initialization before search operations.
 */
export async function setupFTS5Tables(dbUrl: string, authToken?: string): Promise<void> {
  const connection = createDrizzleDb({ url: dbUrl, authToken });
  ftsDb = connection.db;
  ftsDbClose = connection.close;

  await createFTSTables(ftsDb);
}

/**
 * Setup FTS5 tables using an existing database connection.
 * Useful for tests where FTS should share the same in-memory database.
 */
export async function setupFTS5WithDb(db: DrizzleDb): Promise<void> {
  ftsDb = db;
  ftsDbClose = null; // Don't close - caller owns the connection

  await createFTSTables(db);
}

/**
 * Create all FTS5 virtual tables.
 */
async function createFTSTables(db: DrizzleDb): Promise<void> {
  for (const config of Object.values(FTS_TABLES)) {
    await db.run(
      sql.raw(`
        CREATE VIRTUAL TABLE IF NOT EXISTS ${config.table} USING fts5(
          ${config.columns.join(', ')},
          tokenize="unicode61"
        )
      `),
    );
  }
}

/**
 * Close the FTS database connection.
 * Call during app shutdown.
 */
export function closeFTS5Db(): void {
  if (ftsDbClose) {
    ftsDbClose();
    ftsDbClose = null;
    ftsDb = null;
  }
}

/**
 * Get the FTS database instance (for worker/indexing operations).
 */
export function getFTS5Db(): DrizzleDb | null {
  return ftsDb;
}

/**
 * Generic FTS search function.
 */
async function searchFTS(table: string, searchText: string, idColumn = '_id'): Promise<string[]> {
  if (!ftsDb) return [];

  const safeQuery = escapeFTS5WithPrefix(searchText);
  if (!safeQuery) return [];

  const result = await ftsDb.all<Record<string, string>>(
    sql.raw(
      `SELECT ${idColumn} FROM ${table} WHERE ${table} MATCH '${safeQuery}' ORDER BY bm25(${table})`,
    ),
  );

  return result.map((row) => row[idColumn]);
}

/**
 * FTS5 Search Adapter
 */
const FTS5SearchAdapter: ISearchAdapter = {
  ...SearchAdapter,

  key: 'shop.unchained.search.fts5',
  label: 'SQLite FTS5 Full-Text Search',
  version: '1.0.0',
  orderIndex: 10,

  actions: (context: SearchContext) => ({
    ...SearchAdapter.actions(context, { modules: null as any }),

    searchProducts: async () => {
      if (!context.queryString) return [];

      const [productMatches, textMatches] = await Promise.all([
        searchFTS('products_fts', context.queryString),
        searchFTS('product_texts_fts', context.queryString, 'productId'),
      ]);

      return [...new Set([...productMatches, ...textMatches])];
    },

    searchAssortments: async () => {
      if (!context.queryString) return [];

      const [assortmentMatches, textMatches] = await Promise.all([
        searchFTS('assortments_fts', context.queryString),
        searchFTS('assortment_texts_fts', context.queryString, 'assortmentId'),
      ]);

      return [...new Set([...assortmentMatches, ...textMatches])];
    },

    searchUsers: async () => {
      if (!context.queryString) return [];
      return searchFTS('users_fts', context.queryString);
    },

    searchOrders: async () => {
      if (!context.queryString) return [];
      return searchFTS('orders_fts', context.queryString);
    },

    searchQuotations: async () => {
      if (!context.queryString) return [];
      return searchFTS('quotations_fts', context.queryString);
    },

    searchEnrollments: async () => {
      if (!context.queryString) return [];
      return searchFTS('enrollments_fts', context.queryString);
    },

    searchDeliveryProviders: async () => {
      if (!context.queryString) return [];
      return searchFTS('delivery_providers_fts', context.queryString);
    },

    searchPaymentProviders: async () => {
      if (!context.queryString) return [];
      return searchFTS('payment_providers_fts', context.queryString);
    },

    searchWarehousingProviders: async () => {
      if (!context.queryString) return [];
      return searchFTS('warehousing_providers_fts', context.queryString);
    },

    search: async (entityType: string) => {
      if (!context.queryString) return [];

      const config = FTS_TABLES[entityType.toLowerCase()];
      if (!config) return [];

      return searchFTS(config.table, context.queryString, config.idColumn || '_id');
    },
  }),
};

/**
 * Initialize FTS5 search by registering the adapter.
 * Call after setupFTS5Tables().
 */
export function initializeFTS5Search(): void {
  SearchDirector.registerAdapter(FTS5SearchAdapter);
}

/**
 * Upsert an entity into the FTS index.
 * Used by the FTS index worker.
 */
export async function upsertFTSEntity(
  entityType: string,
  entityId: string,
  data: Record<string, string | null | undefined>,
): Promise<void> {
  if (!ftsDb) return;

  const config = FTS_TABLES[entityType.toLowerCase()];
  if (!config) return;

  // Delete existing entry
  const idColumn = config.idColumn || '_id';
  await ftsDb.run(sql.raw(`DELETE FROM ${config.table} WHERE ${idColumn} = '${entityId}'`));

  // Build column list and values (excluding UNINDEXED markers)
  const columns = config.columns.map((c) => c.replace(' UNINDEXED', ''));
  const values = columns.map((col) => {
    const value = data[col];
    // Escape single quotes for SQL
    const escaped = value ? String(value).replace(/'/g, "''") : '';
    return `'${escaped}'`;
  });

  await ftsDb.run(
    sql.raw(`INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${values.join(', ')})`),
  );
}

/**
 * Delete an entity from the FTS index.
 * Used by the FTS index worker.
 */
export async function deleteFTSEntity(entityType: string, entityId: string): Promise<void> {
  if (!ftsDb) return;

  const config = FTS_TABLES[entityType.toLowerCase()];
  if (!config) return;

  const idColumn = config.idColumn || '_id';
  await ftsDb.run(sql.raw(`DELETE FROM ${config.table} WHERE ${idColumn} = '${entityId}'`));
}

/**
 * Clear all entries from an FTS table.
 * Used for full reindexing.
 */
export async function clearFTSTable(entityType: string): Promise<void> {
  if (!ftsDb) return;

  const config = FTS_TABLES[entityType.toLowerCase()];
  if (!config) return;

  await ftsDb.run(sql.raw(`DELETE FROM ${config.table}`));
}

export default FTS5SearchAdapter;
