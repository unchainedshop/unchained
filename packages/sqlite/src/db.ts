import BetterSqlite3, { type Database as BetterSqlite3Database } from 'better-sqlite3';
import { systemLocale } from '@unchainedshop/utils';

// ============================================================================
// Types
// ============================================================================

export interface SelectOptions {
  where?: Record<string, any>;
  orderBy?: { column: string; direction?: 'ASC' | 'DESC' }[];
  limit?: number;
  offset?: number;
}

// MongoDB-style find options for compatibility
export interface FindOptions {
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  projection?: Record<string, 0 | 1>;
}

export interface InitDbOptions {
  path?: string;
}

// ============================================================================
// Utility functions
// ============================================================================

export function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomPart = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    '',
  );
  return (timestamp + randomPart).slice(0, 24);
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toSqliteDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

export function fromSqliteDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr.replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z'));
}

// Convert MongoDB-style options to SQLite SelectOptions
export function toSelectOptions(options?: FindOptions): Partial<SelectOptions> {
  if (!options) return {};

  const result: Partial<SelectOptions> = {};

  if (options.sort) {
    result.orderBy = Object.entries(options.sort).map(([column, direction]) => ({
      column,
      direction: direction === -1 ? 'DESC' : 'ASC',
    }));
  }

  if (options.limit !== undefined) {
    result.limit = options.limit;
  }

  if (options.skip !== undefined) {
    result.offset = options.skip;
  }

  return result;
}

// ============================================================================
// Database Class
// ============================================================================

export class Database {
  private db: BetterSqlite3Database;
  private dbPath: string | null = null;

  constructor(db: BetterSqlite3Database, dbPath?: string) {
    this.db = db;
    this.dbPath = dbPath || null;
  }

  static async create(options: InitDbOptions = {}): Promise<Database> {
    const path = options.path ?? process.env.UNCHAINED_SQLITE_PATH ?? '.db/unchained.sqlite';
    let db: BetterSqlite3Database;
    let dbPath: string | null = null;

    if (path) {
      try {
        const { existsSync, mkdirSync } = await import('node:fs');
        const { dirname } = await import('node:path');
        const dir = dirname(path);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        db = new BetterSqlite3(path);
        dbPath = path;
      } catch {
        db = new BetterSqlite3(':memory:');
      }
    } else {
      db = new BetterSqlite3(':memory:');
    }

    db.pragma('foreign_keys = ON');

    return new Database(db, dbPath || undefined);
  }

  // ============================================================================
  // Core query methods
  // ============================================================================

  run(sql: string, params?: any[]): { changes: number } {
    const stmt = this.db.prepare(sql);
    const result = params && params.length > 0 ? stmt.run(...params) : stmt.run();
    return { changes: result.changes };
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  queryRaw<T = Record<string, any>>(sql: string, params?: any[]): T[] {
    const stmt = this.db.prepare(sql);
    return (params && params.length > 0 ? stmt.all(...params) : stmt.all()) as T[];
  }

  queryColumn<T = any>(sql: string, params?: any[]): T[] {
    const stmt = this.db.prepare(sql).pluck();
    return (params && params.length > 0 ? stmt.all(...params) : stmt.all()) as T[];
  }

  // ============================================================================
  // Document-oriented methods (tables with _id + data JSON)
  // All documents are stored as JSON in a `data` column with virtual columns for indexing
  // ============================================================================

  /**
   * Query documents - automatically parses JSON data column
   */
  query<T>(sql: string, params?: any[]): T[] {
    const rows = this.queryRaw<{ data: string }>(sql, params);
    return rows
      .map((row) => {
        if (!row?.data) return null;
        return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      })
      .filter((item): item is T => item !== null);
  }

  /**
   * Query a single document - automatically parses JSON data column
   */
  queryOne<T>(sql: string, params?: any[]): T | null {
    const results = this.query<T>(sql, params);
    return results[0] || null;
  }

  /**
   * Find documents with MongoDB-style options (sort, limit, skip)
   */
  find<T>(table: string, options: FindOptions & { where?: Record<string, any> } = {}): T[] {
    const { where, ...findOpts } = options;
    const selectOptions = { ...toSelectOptions(findOpts), where };
    const { sql, params } = this.buildSelect(table, 'data', selectOptions);
    return this.query<T>(sql, params);
  }

  /**
   * Find a single document with MongoDB-style options
   */
  findOne<T>(table: string, options: FindOptions & { where?: Record<string, any> } = {}): T | null {
    const results = this.find<T>(table, { ...options, limit: 1 });
    return results[0] || null;
  }

  /**
   * Find a document by ID
   */
  findById<T>(table: string, id: string): T | null {
    return this.queryOne<T>(`SELECT data FROM ${table} WHERE _id = ?`, [id]);
  }

  /**
   * Insert a document
   */
  insert<T extends { _id?: string }>(table: string, doc: T): T & { _id: string } {
    const _id = doc._id || generateId();
    const data = { ...doc, _id };
    this.run(`INSERT INTO ${table} (_id, data) VALUES (?, json(?))`, [_id, JSON.stringify(data)]);
    return data as T & { _id: string };
  }

  /**
   * Update a document by merging with existing data using json_patch
   */
  update<T>(table: string, id: string, updates: Partial<T>): T | null {
    this.run(`UPDATE ${table} SET data = json_patch(data, json(?)) WHERE _id = ?`, [
      JSON.stringify(updates),
      id,
    ]);
    return this.findById<T>(table, id);
  }

  /**
   * Replace a document entirely
   */
  replace<T extends { _id: string }>(table: string, doc: T): T {
    this.run(`UPDATE ${table} SET data = json(?) WHERE _id = ?`, [JSON.stringify(doc), doc._id]);
    return doc;
  }

  /**
   * Delete a document by ID
   */
  delete(table: string, id: string): boolean {
    const { changes } = this.run(`DELETE FROM ${table} WHERE _id = ?`, [id]);
    return changes > 0;
  }

  /**
   * Soft delete - sets deleted timestamp in JSON
   */
  softDelete(table: string, id: string): boolean {
    const now = toSqliteDate(new Date());
    this.run(`UPDATE ${table} SET data = json_set(data, '$.deleted', ?, '$.updated', ?) WHERE _id = ?`, [
      now,
      now,
      id,
    ]);
    return true;
  }

  /**
   * Count documents
   */
  count(table: string, where: Record<string, any> = {}): number {
    const { sql, params } = this.buildSelect(table, 'COUNT(*) as count', { where });
    const rows = this.queryRaw<{ count: number }>(sql, params);
    return rows[0]?.count || 0;
  }

  /**
   * Check if a document exists
   */
  exists(table: string, where: Record<string, any>): boolean {
    const { sql, params } = this.buildSelect(table, '1', { where, limit: 1 });
    const rows = this.queryRaw(sql, params);
    return rows.length > 0;
  }

  /**
   * Find localized text with locale fallback
   */
  findLocalizedText<T>(table: string, selector: Record<string, any>, locale: Intl.Locale): T | null {
    const conditions: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(selector)) {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }

    const baseWhere = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    const localeCondition = `(locale = ? OR locale = ?)`;

    // Try exact locale match first
    const exactQuery = `SELECT data FROM ${table} WHERE ${baseWhere} AND ${localeCondition} ORDER BY locale DESC LIMIT 1`;
    const exactResult = this.queryOne<T>(exactQuery, [...params, locale.baseName, locale.language]);
    if (exactResult) return exactResult;

    // Try system locale fallback
    if (systemLocale.baseName !== locale.baseName) {
      const fallbackQuery = `SELECT data FROM ${table} WHERE ${baseWhere} AND ${localeCondition} ORDER BY locale DESC LIMIT 1`;
      const fallbackResult = this.queryOne<T>(fallbackQuery, [
        ...params,
        systemLocale.baseName,
        systemLocale.language,
      ]);
      if (fallbackResult) return fallbackResult;
    }

    // Fall back to any locale
    const anyQuery = `SELECT data FROM ${table} WHERE ${baseWhere} ORDER BY locale DESC LIMIT 1`;
    return this.queryOne<T>(anyQuery, params);
  }

  // ============================================================================
  // SQL Builder
  // ============================================================================

  buildSelect(
    table: string,
    columns: string | string[] = 'data',
    options: SelectOptions = {},
  ): { sql: string; params: any[] } {
    const columnStr = Array.isArray(columns) ? columns.join(', ') : columns;
    let sql = `SELECT ${columnStr} FROM ${table}`;
    const params: any[] = [];

    if (options.where && Object.keys(options.where).length > 0) {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(options.where)) {
        const snakeKey = toSnakeCase(key);
        if (value === null) {
          conditions.push(`${snakeKey} IS NULL`);
        } else if (Array.isArray(value)) {
          const placeholders = value.map(() => '?').join(', ');
          conditions.push(`${snakeKey} IN (${placeholders})`);
          params.push(...value);
        } else if (typeof value === 'object' && value !== null) {
          for (const [op, opValue] of Object.entries(value)) {
            switch (op) {
              case '$ne':
                if (opValue === null) {
                  conditions.push(`${snakeKey} IS NOT NULL`);
                } else {
                  conditions.push(`${snakeKey} != ?`);
                  params.push(opValue);
                }
                break;
              case '$in':
                if (Array.isArray(opValue) && opValue.length > 0) {
                  const placeholders = opValue.map(() => '?').join(', ');
                  conditions.push(`${snakeKey} IN (${placeholders})`);
                  params.push(...opValue);
                }
                break;
              case '$nin':
                if (Array.isArray(opValue) && opValue.length > 0) {
                  const placeholders = opValue.map(() => '?').join(', ');
                  conditions.push(`${snakeKey} NOT IN (${placeholders})`);
                  params.push(...opValue);
                }
                break;
              case '$gt':
                conditions.push(`${snakeKey} > ?`);
                params.push(opValue);
                break;
              case '$gte':
                conditions.push(`${snakeKey} >= ?`);
                params.push(opValue);
                break;
              case '$lt':
                conditions.push(`${snakeKey} < ?`);
                params.push(opValue);
                break;
              case '$lte':
                conditions.push(`${snakeKey} <= ?`);
                params.push(opValue);
                break;
              case '$like':
                conditions.push(`${snakeKey} LIKE ?`);
                params.push(opValue);
                break;
              case '$exists':
                conditions.push(opValue ? `${snakeKey} IS NOT NULL` : `${snakeKey} IS NULL`);
                break;
              case '$jsonContains':
                conditions.push(
                  `EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.${key}')) WHERE value = ?)`,
                );
                params.push(opValue);
                break;
              case '$jsonContainsAny':
                if (Array.isArray(opValue) && opValue.length > 0) {
                  const orConditions = opValue.map(
                    () =>
                      `EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.${key}')) WHERE value = ?)`,
                  );
                  conditions.push(`(${orConditions.join(' OR ')})`);
                  params.push(...opValue);
                }
                break;
              case '$jsonContainsAll':
                if (Array.isArray(opValue) && opValue.length > 0) {
                  const andConditions = opValue.map(
                    () =>
                      `EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.${key}')) WHERE value = ?)`,
                  );
                  conditions.push(`(${andConditions.join(' AND ')})`);
                  params.push(...opValue);
                }
                break;
              default:
                conditions.push(`${snakeKey} = ?`);
                params.push(opValue);
            }
          }
        } else {
          conditions.push(`${snakeKey} = ?`);
          params.push(value);
        }
      }
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (options.orderBy && options.orderBy.length > 0) {
      const orderClauses = options.orderBy.map(
        ({ column, direction }) => `${toSnakeCase(column)} ${direction || 'ASC'}`,
      );
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    if (options.limit !== undefined) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset !== undefined) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }

    return { sql, params };
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  persist(): void {
    // better-sqlite3 writes directly to the file, no explicit persist needed
    // This method is kept for API compatibility
  }

  export(): Uint8Array {
    return this.db.serialize();
  }

  close(): void {
    this.db.close();
  }
}

export type SqlJsDatabase = BetterSqlite3Database;
