/**
 * Turso (libSQL) adapter for @unchainedshop/store.
 * Stores data in a distributed SQLite database via Turso.
 */

import type { Entity } from '../types.js';
import type {
  IStore,
  ITable,
  FilterQuery,
  FindOptions,
  InsertResult,
  InsertManyResult,
  UpdateResult,
  DeleteResult,
  UpdateQuery,
  StoreConfig,
} from '../types.js';

// Dynamic import to handle optional peer dependency
let createClient: typeof import('@libsql/client').createClient;

async function ensureLibsqlLoaded() {
  if (!createClient) {
    try {
      const libsql = await import('@libsql/client');
      createClient = libsql.createClient;
    } catch {
      throw new Error(
        'Turso adapter requires @libsql/client. Install it with: npm install @libsql/client',
      );
    }
  }
}

export interface TursoConfig extends StoreConfig {
  /**
   * Turso database URL (e.g., "libsql://your-db.turso.io" or "file:local.db")
   */
  url: string;

  /**
   * Turso authentication token (required for remote databases)
   */
  authToken?: string;

  /**
   * Table schemas - defines the columns for each table
   */
  schemas?: Record<string, TableSchema>;
}

export interface TableSchema {
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  fts?: FTSConfig;
}

export interface FTSConfig {
  /**
   * Columns to include in full-text search index.
   */
  columns: string[];
  /**
   * Optional tokenizer (default: 'unicode61')
   */
  tokenizer?: string;
}

export interface ColumnDefinition {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB';
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
  default?: string | number | null;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

type LibSQLClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Generate a random ID similar to MongoDB ObjectId.
 */
function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomPart = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    '',
  );
  return timestamp + randomPart;
}

/**
 * Convert a filter query to SQL WHERE clause.
 * The ftsTableName parameter is used when $text search is present.
 */
function filterToSQL<T extends Entity>(
  filter: FilterQuery<T>,
  ftsTableName?: string,
): { sql: string; params: unknown[]; usesFts: boolean } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let usesFts = false;

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$and') {
      const subConditions = (value as FilterQuery<T>[]).map((subFilter) =>
        filterToSQL(subFilter, ftsTableName),
      );
      const andSql = subConditions.map((c) => `(${c.sql})`).join(' AND ');
      conditions.push(`(${andSql})`);
      params.push(...subConditions.flatMap((c) => c.params));
      if (subConditions.some((c) => c.usesFts)) usesFts = true;
    } else if (key === '$or') {
      const subConditions = (value as FilterQuery<T>[]).map((subFilter) =>
        filterToSQL(subFilter, ftsTableName),
      );
      const orSql = subConditions.map((c) => `(${c.sql})`).join(' OR ');
      conditions.push(`(${orSql})`);
      params.push(...subConditions.flatMap((c) => c.params));
      if (subConditions.some((c) => c.usesFts)) usesFts = true;
    } else if (key === '$text') {
      // Full-text search using FTS5
      const searchText = (value as { $search: string }).$search;
      if (ftsTableName) {
        // Use FTS5 MATCH - fast full-text search
        conditions.push(`"${ftsTableName}" MATCH ?`);
        // FTS5 query syntax: escape special chars and add prefix matching
        const escapedSearch = searchText.replace(/[*"\\]/g, '');
        params.push(`"${escapedSearch}"*`);
        usesFts = true;
      } else {
        // Fallback: LIKE matching (slower but works without FTS)
        conditions.push(`_id LIKE ?`);
        params.push(`%${searchText}%`);
      }
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Operator object
      const operators = value as Record<string, unknown>;
      for (const [op, opValue] of Object.entries(operators)) {
        switch (op) {
          case '$eq':
            conditions.push(`"${key}" = ?`);
            params.push(opValue);
            break;
          case '$ne':
            if (opValue === null) {
              conditions.push(`"${key}" IS NOT NULL`);
            } else {
              conditions.push(`"${key}" != ?`);
              params.push(opValue);
            }
            break;
          case '$gt':
            conditions.push(`"${key}" > ?`);
            params.push(opValue);
            break;
          case '$gte':
            conditions.push(`"${key}" >= ?`);
            params.push(opValue);
            break;
          case '$lt':
            conditions.push(`"${key}" < ?`);
            params.push(opValue);
            break;
          case '$lte':
            conditions.push(`"${key}" <= ?`);
            params.push(opValue);
            break;
          case '$in':
            if (Array.isArray(opValue) && opValue.length > 0) {
              const placeholders = opValue.map(() => '?').join(', ');
              conditions.push(`"${key}" IN (${placeholders})`);
              params.push(...opValue);
            } else {
              // Empty $in - nothing matches
              conditions.push('0 = 1');
            }
            break;
          case '$nin':
            if (Array.isArray(opValue) && opValue.length > 0) {
              const placeholders = opValue.map(() => '?').join(', ');
              conditions.push(`"${key}" NOT IN (${placeholders})`);
              params.push(...opValue);
            }
            break;
          case '$exists':
            if (opValue) {
              conditions.push(`"${key}" IS NOT NULL`);
            } else {
              conditions.push(`"${key}" IS NULL`);
            }
            break;
          case '$regex':
            // SQLite uses GLOB or LIKE for pattern matching
            conditions.push(`"${key}" LIKE ?`);
            // Convert simple regex to LIKE pattern (very basic)
            params.push(`%${opValue}%`);
            break;
        }
      }
    } else if (value === null) {
      conditions.push(`"${key}" IS NULL`);
    } else {
      conditions.push(`"${key}" = ?`);
      params.push(value);
    }
  }

  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '1 = 1',
    params,
    usesFts,
  };
}

/**
 * Convert sort options to SQL ORDER BY clause.
 */
function sortToSQL(options?: FindOptions): string {
  if (!options?.sort || options.sort.length === 0) {
    return '';
  }

  const orderClauses = options.sort.map(({ key, value }) => {
    const direction = value === 'DESC' ? 'DESC' : 'ASC';
    return `"${key}" ${direction}`;
  });

  return `ORDER BY ${orderClauses.join(', ')}`;
}

/**
 * Convert row to entity (handle JSON columns, dates, booleans, etc.)
 */
function rowToEntity<T extends Entity>(row: Record<string, unknown>): T {
  const entity: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'string') {
      // Try to parse JSON for object/array columns
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          entity[key] = JSON.parse(value);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    } else if (
      typeof value === 'number' &&
      (key.includes('created') || key.includes('updated') || key.includes('deleted'))
    ) {
      // Convert timestamp to Date
      entity[key] = value ? new Date(value) : null;
    } else if (typeof value === 'number' && key.startsWith('is')) {
      // Convert integer to boolean for fields like isActive, isDeleted, etc.
      entity[key] = value === 1;
    } else {
      entity[key] = value;
    }
  }

  return entity as T;
}

/**
 * Convert entity to row values for INSERT/UPDATE.
 */
function entityToRow<T extends Entity>(entity: Partial<T>): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(entity)) {
    // Skip undefined values - SQLite doesn't accept undefined
    if (value === undefined) {
      continue;
    }
    if (value instanceof Date) {
      row[key] = value.getTime();
    } else if (typeof value === 'boolean') {
      // Convert boolean to integer for SQLite
      row[key] = value ? 1 : 0;
    } else if (typeof value === 'object' && value !== null) {
      row[key] = JSON.stringify(value);
    } else {
      row[key] = value;
    }
  }

  return row;
}

/**
 * Create a Turso table wrapper.
 */
function createTursoTable<T extends Entity>(
  client: LibSQLClient,
  tableName: string,
  schema?: TableSchema,
): ITable<T> {
  // FTS table name if FTS is configured
  const ftsTableName = schema?.fts ? `${tableName}_fts` : undefined;

  return {
    async findOne(filter: FilterQuery<T>): Promise<T | null> {
      const { sql: whereClause, params, usesFts } = filterToSQL(filter, ftsTableName);

      let sql: string;
      if (usesFts && ftsTableName) {
        // Join with FTS table for full-text search
        sql = `SELECT t.* FROM "${tableName}" t
               INNER JOIN "${ftsTableName}" fts ON t._id = fts._id
               WHERE ${whereClause} LIMIT 1`;
      } else {
        sql = `SELECT * FROM "${tableName}" WHERE ${whereClause} LIMIT 1`;
      }

      const result = await client.execute({ sql, args: params as any[] });

      if (result.rows.length === 0) return null;
      return rowToEntity<T>(result.rows[0] as Record<string, unknown>);
    },

    async find(filter: FilterQuery<T>, options?: FindOptions): Promise<T[]> {
      const { sql: whereClause, params, usesFts } = filterToSQL(filter, ftsTableName);
      const orderBy = sortToSQL(options);
      const limit = options?.limit ? `LIMIT ${options.limit}` : '';
      const offset = options?.offset ? `OFFSET ${options.offset}` : '';

      let sql: string;
      if (usesFts && ftsTableName) {
        // Join with FTS table for full-text search, order by relevance (bm25)
        const orderClause = orderBy || `ORDER BY bm25("${ftsTableName}")`;
        sql = `SELECT t.* FROM "${tableName}" t
               INNER JOIN "${ftsTableName}" fts ON t._id = fts._id
               WHERE ${whereClause} ${orderClause} ${limit} ${offset}`;
      } else {
        sql = `SELECT * FROM "${tableName}" WHERE ${whereClause} ${orderBy} ${limit} ${offset}`;
      }

      const result = await client.execute({ sql, args: params as any[] });

      return result.rows.map((row) => rowToEntity<T>(row as Record<string, unknown>));
    },

    async insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<InsertResult> {
      const id = doc._id || generateId();
      const fullDoc = { ...doc, _id: id };
      const row = entityToRow(fullDoc);
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(row);

      await client.execute({
        sql: `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
        args: values as any[],
      });

      return { insertedId: id };
    },

    async insertMany(docs: (Omit<T, '_id'> & { _id?: string })[]): Promise<InsertManyResult> {
      const insertedIds: string[] = [];

      // Use a transaction for batch insert
      await client.batch(
        docs.map((doc) => {
          const id = doc._id || generateId();
          insertedIds.push(id);
          const fullDoc = { ...doc, _id: id };
          const row = entityToRow(fullDoc);
          const columns = Object.keys(row);
          const placeholders = columns.map(() => '?').join(', ');
          const values = Object.values(row);

          return {
            sql: `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
            args: values as any[],
          };
        }),
      );

      return { insertedIds, insertedCount: insertedIds.length };
    },

    async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateResult> {
      const { sql: whereClause, params: whereParams } = filterToSQL(filter);

      // Build SET clause from update operations
      const setClauses: string[] = [];
      const setParams: unknown[] = [];

      if (update.$set) {
        const row = entityToRow(update.$set);
        for (const [key, value] of Object.entries(row)) {
          setClauses.push(`"${key}" = ?`);
          setParams.push(value);
        }
      }

      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) {
          setClauses.push(`"${key}" = NULL`);
        }
      }

      if (update.$inc) {
        for (const [key, amount] of Object.entries(update.$inc)) {
          setClauses.push(`"${key}" = "${key}" + ?`);
          setParams.push(amount);
        }
      }

      if (setClauses.length === 0) {
        return { matchedCount: 0, modifiedCount: 0 };
      }

      // Get the _id of the first matching row to update only one
      const findResult = await client.execute({
        sql: `SELECT _id FROM "${tableName}" WHERE ${whereClause} LIMIT 1`,
        args: whereParams as any[],
      });

      if (findResult.rows.length === 0) {
        return { matchedCount: 0, modifiedCount: 0 };
      }

      const id = findResult.rows[0]._id;

      const result = await client.execute({
        sql: `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE _id = ?`,
        args: [...setParams, id] as any[],
      });

      return {
        matchedCount: result.rowsAffected,
        modifiedCount: result.rowsAffected,
      };
    },

    async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateResult> {
      const { sql: whereClause, params: whereParams } = filterToSQL(filter);

      const setClauses: string[] = [];
      const setParams: unknown[] = [];

      if (update.$set) {
        const row = entityToRow(update.$set);
        for (const [key, value] of Object.entries(row)) {
          setClauses.push(`"${key}" = ?`);
          setParams.push(value);
        }
      }

      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) {
          setClauses.push(`"${key}" = NULL`);
        }
      }

      if (update.$inc) {
        for (const [key, amount] of Object.entries(update.$inc)) {
          setClauses.push(`"${key}" = "${key}" + ?`);
          setParams.push(amount);
        }
      }

      if (setClauses.length === 0) {
        return { matchedCount: 0, modifiedCount: 0 };
      }

      const result = await client.execute({
        sql: `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${whereClause}`,
        args: [...setParams, ...whereParams] as any[],
      });

      return {
        matchedCount: result.rowsAffected,
        modifiedCount: result.rowsAffected,
      };
    },

    async deleteOne(filter: FilterQuery<T>): Promise<DeleteResult> {
      const { sql: whereClause, params } = filterToSQL(filter);

      // Get the _id of the first matching row
      const findResult = await client.execute({
        sql: `SELECT _id FROM "${tableName}" WHERE ${whereClause} LIMIT 1`,
        args: params as any[],
      });

      if (findResult.rows.length === 0) {
        return { deletedCount: 0 };
      }

      const id = findResult.rows[0]._id;

      const result = await client.execute({
        sql: `DELETE FROM "${tableName}" WHERE _id = ?`,
        args: [id],
      });

      return { deletedCount: result.rowsAffected };
    },

    async deleteMany(filter: FilterQuery<T>): Promise<DeleteResult> {
      const { sql: whereClause, params } = filterToSQL(filter);

      const result = await client.execute({
        sql: `DELETE FROM "${tableName}" WHERE ${whereClause}`,
        args: params as any[],
      });

      return { deletedCount: result.rowsAffected };
    },

    async countDocuments(filter?: FilterQuery<T>): Promise<number> {
      const {
        sql: whereClause,
        params,
        usesFts,
      } = filter ? filterToSQL(filter, ftsTableName) : { sql: '1 = 1', params: [], usesFts: false };

      let sql: string;
      if (usesFts && ftsTableName) {
        sql = `SELECT COUNT(*) as count FROM "${tableName}" t
               INNER JOIN "${ftsTableName}" fts ON t._id = fts._id
               WHERE ${whereClause}`;
      } else {
        sql = `SELECT COUNT(*) as count FROM "${tableName}" WHERE ${whereClause}`;
      }

      const result = await client.execute({ sql, args: params as any[] });
      return Number(result.rows[0]?.count ?? 0);
    },

    async distinct<K extends keyof T>(field: K, filter?: FilterQuery<T>): Promise<T[K][]> {
      const {
        sql: whereClause,
        params,
        usesFts,
      } = filter ? filterToSQL(filter, ftsTableName) : { sql: '1 = 1', params: [], usesFts: false };

      let sql: string;
      if (usesFts && ftsTableName) {
        sql = `SELECT DISTINCT t."${String(field)}" FROM "${tableName}" t
               INNER JOIN "${ftsTableName}" fts ON t._id = fts._id
               WHERE ${whereClause}`;
      } else {
        sql = `SELECT DISTINCT "${String(field)}" FROM "${tableName}" WHERE ${whereClause}`;
      }

      const result = await client.execute({ sql, args: params as any[] });
      return result.rows.map((row) => row[String(field)] as T[K]);
    },

    // Note: Turso doesn't support reactive subscriptions natively
    // This would require a separate change notification system
  };
}

/**
 * Create a Turso store.
 */
export async function createTursoStore(config: TursoConfig): Promise<IStore> {
  await ensureLibsqlLoaded();

  const client = createClient({
    url: config.url,
    authToken: config.authToken,
  });

  const tables = new Map<string, ITable<Entity>>();
  const schemas = config.schemas || {};

  const store: IStore = {
    environment: config.environment || 'server',

    table<T extends Entity>(name: string): ITable<T> {
      if (!tables.has(name)) {
        const schema = schemas[name];
        tables.set(name, createTursoTable<Entity>(client, name, schema));
      }
      return tables.get(name) as ITable<T>;
    },

    async transaction<R>(fn: (store: IStore) => Promise<R>): Promise<R> {
      // libSQL supports transactions via batch()
      // For simplicity, just execute the function
      // TODO: Implement proper transaction support
      return fn(store);
    },

    async initialize(): Promise<void> {
      // Create tables from schemas
      for (const [tableName, schema] of Object.entries(schemas)) {
        const columnDefs = schema.columns.map((col) => {
          let def = `"${col.name}" ${col.type}`;
          if (col.primaryKey) def += ' PRIMARY KEY';
          if (col.notNull) def += ' NOT NULL';
          if (col.unique) def += ' UNIQUE';
          if (col.default !== undefined) {
            if (col.default === null) {
              def += ' DEFAULT NULL';
            } else if (typeof col.default === 'string') {
              def += ` DEFAULT '${col.default}'`;
            } else {
              def += ` DEFAULT ${col.default}`;
            }
          }
          return def;
        });

        await client.execute({
          sql: `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefs.join(', ')})`,
          args: [],
        });

        // Create regular indexes
        if (schema.indexes) {
          for (const index of schema.indexes) {
            const unique = index.unique ? 'UNIQUE' : '';
            const columns = index.columns.map((c) => `"${c}"`).join(', ');
            await client.execute({
              sql: `CREATE ${unique} INDEX IF NOT EXISTS "${index.name}" ON "${tableName}" (${columns})`,
              args: [],
            });
          }
        }

        // Create FTS5 virtual table and triggers for full-text search
        if (schema.fts) {
          const ftsTableName = `${tableName}_fts`;
          const ftsColumns = schema.fts.columns.join(', ');
          const tokenizer = schema.fts.tokenizer || 'unicode61';

          // Create FTS5 virtual table with _id as first column for joins
          // We store _id separately since TEXT _id can't be used as rowid
          await client.execute({
            sql: `CREATE VIRTUAL TABLE IF NOT EXISTS "${ftsTableName}" USING fts5(
              _id,
              ${ftsColumns},
              tokenize="${tokenizer}"
            )`,
            args: [],
          });

          // Create triggers to keep FTS index in sync with main table
          // INSERT trigger
          await client.execute({
            sql: `CREATE TRIGGER IF NOT EXISTS "${tableName}_ai" AFTER INSERT ON "${tableName}" BEGIN
              INSERT INTO "${ftsTableName}" (_id, ${ftsColumns})
              VALUES (NEW._id, ${schema.fts.columns.map((c) => `NEW."${c}"`).join(', ')});
            END`,
            args: [],
          });

          // DELETE trigger
          await client.execute({
            sql: `CREATE TRIGGER IF NOT EXISTS "${tableName}_ad" AFTER DELETE ON "${tableName}" BEGIN
              DELETE FROM "${ftsTableName}" WHERE _id = OLD._id;
            END`,
            args: [],
          });

          // UPDATE trigger
          await client.execute({
            sql: `CREATE TRIGGER IF NOT EXISTS "${tableName}_au" AFTER UPDATE ON "${tableName}" BEGIN
              DELETE FROM "${ftsTableName}" WHERE _id = OLD._id;
              INSERT INTO "${ftsTableName}" (_id, ${ftsColumns})
              VALUES (NEW._id, ${schema.fts.columns.map((c) => `NEW."${c}"`).join(', ')});
            END`,
            args: [],
          });
        }
      }
    },

    async close(): Promise<void> {
      client.close();
    },
  };

  return store;
}
