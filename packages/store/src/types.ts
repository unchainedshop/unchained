/**
 * Base entity interface that all entities must implement.
 */
export interface Entity {
  _id: string;
}

/**
 * Standard timestamp fields for tracking entity lifecycle.
 */
export interface TimestampFields {
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

/**
 * Sort direction for queries.
 */
export type SortDirection = 'ASC' | 'DESC';

/**
 * Sort option for queries.
 */
export interface SortOption {
  key: string;
  value: SortDirection;
}

/**
 * Storage environment detection.
 */
export type StorageEnvironment = 'browser' | 'server' | 'worker';

/**
 * Filter operators for queries (MongoDB-style for familiarity).
 */
export interface FilterOperator<V> {
  $eq?: V;
  $ne?: V;
  $gt?: V;
  $gte?: V;
  $lt?: V;
  $lte?: V;
  $in?: V[];
  $nin?: V[];
  $exists?: boolean;
  $regex?: string;
}

/**
 * Filter query type for querying entities.
 * Supports both direct value matching and operators.
 */
export type FilterQuery<T> = {
  [K in keyof T]?: T[K] | FilterOperator<T[K]>;
} & {
  $and?: FilterQuery<T>[];
  $or?: FilterQuery<T>[];
  $text?: { $search: string };
};

/**
 * Options for find operations.
 */
export interface FindOptions {
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

/**
 * Result of an insert operation.
 */
export interface InsertResult {
  insertedId: string;
}

/**
 * Result of an insert many operation.
 */
export interface InsertManyResult {
  insertedIds: string[];
  insertedCount: number;
}

/**
 * Result of an update operation.
 */
export interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

/**
 * Result of a delete operation.
 */
export interface DeleteResult {
  deletedCount: number;
}

/**
 * Update operators for mutations.
 */
export interface UpdateQuery<T> {
  $set?: Partial<T>;
  $unset?: Partial<Record<keyof T, true>>;
  $inc?: Partial<Record<keyof T, number>>;
  $push?: Partial<Record<keyof T, unknown>>;
  $pull?: Partial<Record<keyof T, unknown>>;
}

/**
 * Table interface for storage adapters.
 * Provides CRUD operations.
 */
export interface ITable<T extends Entity> {
  /**
   * Find a single document matching the filter.
   */
  findOne(filter: FilterQuery<T>): Promise<T | null>;

  /**
   * Find all documents matching the filter.
   */
  find(filter: FilterQuery<T>, options?: FindOptions): Promise<T[]>;

  /**
   * Insert a single document.
   */
  insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<InsertResult>;

  /**
   * Insert multiple documents.
   */
  insertMany(docs: (Omit<T, '_id'> & { _id?: string })[]): Promise<InsertManyResult>;

  /**
   * Update a single document matching the filter.
   */
  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateResult>;

  /**
   * Update all documents matching the filter.
   */
  updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateResult>;

  /**
   * Delete a single document matching the filter.
   */
  deleteOne(filter: FilterQuery<T>): Promise<DeleteResult>;

  /**
   * Delete all documents matching the filter.
   */
  deleteMany(filter: FilterQuery<T>): Promise<DeleteResult>;

  /**
   * Count documents matching the filter.
   */
  countDocuments(filter?: FilterQuery<T>): Promise<number>;

  /**
   * Get distinct values for a field.
   */
  distinct<K extends keyof T>(field: K, filter?: FilterQuery<T>): Promise<T[K][]>;
}

/**
 * Change record for sync operations.
 */
export interface Change {
  table: string;
  pk: string;
  column: string;
  value: unknown;
  colVersion: number;
  dbVersion: number;
  siteId: string;
}

/**
 * Store interface - manages tables and sync.
 */
export interface IStore {
  /**
   * The environment this store is running in.
   */
  environment: StorageEnvironment;

  /**
   * Get a table by name.
   */
  table<T extends Entity>(name: string): ITable<T>;

  /**
   * Execute a transaction.
   */
  transaction<R>(fn: (store: IStore) => Promise<R>): Promise<R>;

  /**
   * Get changes since a specific version (for sync).
   */
  getChangesSince?(version: number): Promise<Change[]>;

  /**
   * Apply changes from another source (for sync).
   */
  applyChanges?(changes: Change[]): Promise<void>;

  /**
   * Get the current version/timestamp.
   */
  getCurrentVersion?(): number;

  /**
   * Initialize the store (create tables, run migrations, etc.).
   */
  initialize(): Promise<void>;

  /**
   * Close the store and clean up resources.
   */
  close(): Promise<void>;
}

/**
 * Configuration for creating a store.
 */
export interface StoreConfig {
  /**
   * The environment this store will run in.
   */
  environment?: StorageEnvironment;
}

/**
 * Factory function type for creating stores.
 */
export type CreateStore = (config?: StoreConfig) => Promise<IStore>;
