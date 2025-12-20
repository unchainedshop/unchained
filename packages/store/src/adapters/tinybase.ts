/**
 * TinyBase adapter for @unchainedshop/store.
 * Stores data in browser using TinyBase with optional IndexedDB persistence.
 *
 * This adapter provides reactive subscriptions for real-time UI updates.
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
  Unsubscribe,
} from '../types.js';

// Dynamic imports to handle optional peer dependencies
let createStore: typeof import('tinybase').createStore;
let createIndexedDbPersister:
  | typeof import('tinybase/persisters/persister-indexed-db').createIndexedDbPersister
  | undefined;
let Fuse: typeof import('fuse.js').default | undefined;

async function ensureTinyBaseLoaded() {
  if (!createStore) {
    try {
      const tinybase = await import('tinybase');
      createStore = tinybase.createStore;
    } catch {
      throw new Error('TinyBase adapter requires tinybase. Install it with: npm install tinybase');
    }
  }
}

async function loadFuse() {
  if (Fuse === undefined) {
    try {
      const fuseModule = await import('fuse.js');
      Fuse = fuseModule.default;
    } catch {
      // Fuse.js not available - will fall back to simple substring search
      Fuse = undefined;
    }
  }
  return Fuse;
}

async function loadIndexedDbPersister() {
  if (!createIndexedDbPersister) {
    try {
      const persisterModule = await import('tinybase/persisters/persister-indexed-db');
      createIndexedDbPersister = persisterModule.createIndexedDbPersister;
    } catch {
      // IndexedDB persister not available (e.g., in Node.js)
      createIndexedDbPersister = undefined;
    }
  }
  return createIndexedDbPersister;
}

export interface TinyBaseConfig extends StoreConfig {
  /**
   * Name of the store (used for IndexedDB database name).
   */
  name?: string;

  /**
   * Whether to persist to IndexedDB (browser only).
   * @default true in browser, false in Node.js
   */
  persist?: boolean;

  /**
   * Sync server URL for CR-SQLite sync (future feature).
   */
  syncUrl?: string;

  /**
   * Search configuration per table.
   * Defines which fields to include in fuzzy search.
   */
  searchConfig?: Record<string, SearchConfig>;
}

export interface SearchConfig {
  /**
   * Fields to include in full-text search.
   */
  keys: string[];
  /**
   * Fuse.js threshold (0 = exact match, 1 = match anything).
   * @default 0.3
   */
  threshold?: number;
}

type TinyBaseStore = ReturnType<typeof createStore>;
type TinyBasePersister = Awaited<ReturnType<NonNullable<typeof createIndexedDbPersister>>>;

/**
 * Generate a unique ID.
 */
function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomPart = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    '',
  );
  return timestamp + randomPart;
}

/**
 * Convert TinyBase row data to entity.
 */
function rowToEntity<T extends Entity>(rowId: string, row: Record<string, unknown>): T {
  const entity: Record<string, unknown> = { _id: rowId };

  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'string') {
      // Try to parse JSON for object/array columns
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          entity[key] = JSON.parse(value);
        } catch {
          entity[key] = value;
        }
      } else if (value === '__null__') {
        entity[key] = null;
      } else if (value.startsWith('__date__')) {
        // Parse date strings
        entity[key] = new Date(parseInt(value.replace('__date__', ''), 10));
      } else {
        entity[key] = value;
      }
    } else if (typeof value === 'number' && key.startsWith('is')) {
      // Convert 0/1 to boolean for fields like isActive
      entity[key] = value === 1;
    } else {
      entity[key] = value;
    }
  }

  return entity as T;
}

/**
 * Convert entity to TinyBase row data.
 */
function entityToRow<T extends Entity>(entity: Partial<T>): Record<string, string | number | boolean> {
  const row: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(entity)) {
    if (key === '_id') continue; // _id is stored as the row key

    if (value instanceof Date) {
      row[key] = `__date__${value.getTime()}`;
    } else if (value === null) {
      row[key] = '__null__';
    } else if (typeof value === 'boolean') {
      row[key] = value ? 1 : 0;
    } else if (typeof value === 'object') {
      row[key] = JSON.stringify(value);
    } else if (value !== undefined) {
      row[key] = value as string | number;
    }
  }

  return row;
}

/**
 * Check if a row matches a filter query.
 */
function matchesFilter<T extends Entity>(entity: T, filter: FilterQuery<T>): boolean {
  for (const [key, condition] of Object.entries(filter)) {
    // Handle logical operators
    if (key === '$and') {
      if (!(condition as FilterQuery<T>[]).every((subFilter) => matchesFilter(entity, subFilter))) {
        return false;
      }
      continue;
    }

    if (key === '$or') {
      if (!(condition as FilterQuery<T>[]).some((subFilter) => matchesFilter(entity, subFilter))) {
        return false;
      }
      continue;
    }

    if (key === '$text') {
      // Full-text search - simple substring match
      const searchText = ((condition as { $search: string }).$search || '').toLowerCase();
      const entityValues = Object.values(entity)
        .filter((v) => typeof v === 'string')
        .map((v) => (v as string).toLowerCase());
      if (!entityValues.some((v) => v.includes(searchText))) {
        return false;
      }
      continue;
    }

    const value = entity[key as keyof T];

    // Handle operators
    if (condition !== null && typeof condition === 'object' && !Array.isArray(condition)) {
      const operators = condition as Record<string, unknown>;
      for (const [op, opValue] of Object.entries(operators)) {
        switch (op) {
          case '$eq':
            if (value !== opValue) return false;
            break;
          case '$ne':
            if (value === opValue) return false;
            break;
          case '$gt':
            if (typeof value !== 'number' || value <= (opValue as number)) return false;
            break;
          case '$gte':
            if (typeof value !== 'number' || value < (opValue as number)) return false;
            break;
          case '$lt':
            if (typeof value !== 'number' || value >= (opValue as number)) return false;
            break;
          case '$lte':
            if (typeof value !== 'number' || value > (opValue as number)) return false;
            break;
          case '$in':
            if (!(opValue as unknown[]).includes(value)) return false;
            break;
          case '$nin':
            if ((opValue as unknown[]).includes(value)) return false;
            break;
          case '$exists':
            if (opValue && value === undefined) return false;
            if (!opValue && value !== undefined) return false;
            break;
          case '$regex':
            if (typeof value !== 'string') return false;
            if (!new RegExp(opValue as string).test(value)) return false;
            break;
        }
      }
    } else if (condition === null) {
      if (value !== null && value !== undefined) return false;
    } else if (value !== condition) {
      return false;
    }
  }

  return true;
}

/**
 * Create a TinyBase table wrapper.
 */
function createTinyBaseTable<T extends Entity>(
  tinybaseStore: TinyBaseStore,
  tableName: string,
  searchConfig?: SearchConfig,
): ITable<T> {
  // Fuse.js instance for fast fuzzy search (lazily initialized)
  let fuseInstance: InstanceType<typeof import('fuse.js').default> | null = null;
  let fuseDataVersion = 0;
  let currentDataVersion = 0;

  /**
   * Get all entities from the table.
   */
  function getAllEntities(): T[] {
    const table = tinybaseStore.getTable(tableName);
    return Object.entries(table).map(([id, row]) => rowToEntity<T>(id, row as Record<string, unknown>));
  }

  /**
   * Get or create Fuse.js instance for fuzzy search.
   */
  async function getFuseInstance(): Promise<InstanceType<typeof import('fuse.js').default> | null> {
    if (!searchConfig) return null;

    const FuseClass = await loadFuse();
    if (!FuseClass) return null;

    // Rebuild index if data changed
    if (!fuseInstance || fuseDataVersion !== currentDataVersion) {
      const entities = getAllEntities();
      fuseInstance = new FuseClass(entities, {
        keys: searchConfig.keys,
        threshold: searchConfig.threshold ?? 0.3,
        includeScore: true,
        ignoreLocation: true,
      });
      fuseDataVersion = currentDataVersion;
    }

    return fuseInstance;
  }

  /**
   * Invalidate Fuse index when data changes.
   */
  function invalidateFuseIndex() {
    currentDataVersion++;
  }

  return {
    async findOne(filter: FilterQuery<T>): Promise<T | null> {
      // Optimize for _id lookup
      if ('_id' in filter && typeof filter._id === 'string') {
        const row = tinybaseStore.getRow(tableName, filter._id);
        if (!row || Object.keys(row).length === 0) return null;
        const entity = rowToEntity<T>(filter._id, row as Record<string, unknown>);

        // Check other filter conditions
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id: _, ...otherFilters } = filter;
        if (
          Object.keys(otherFilters).length > 0 &&
          !matchesFilter(entity, otherFilters as FilterQuery<T>)
        ) {
          return null;
        }
        return entity;
      }

      // Full table scan
      const entities = getAllEntities();
      return entities.find((entity) => matchesFilter(entity, filter)) || null;
    },

    async find(filter: FilterQuery<T>, options?: FindOptions): Promise<T[]> {
      let entities: T[];

      // Use Fuse.js for $text search if available
      if ('$text' in filter && filter.$text) {
        const searchText = filter.$text.$search;
        const fuse = await getFuseInstance();

        if (fuse && searchText) {
          // Use Fuse.js for fast fuzzy search
          const fuseResults = fuse.search(searchText);
          entities = fuseResults.map((result) => result.item as T);

          // Apply other filters (excluding $text)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { $text: _, ...otherFilters } = filter;
          if (Object.keys(otherFilters).length > 0) {
            entities = entities.filter((entity) =>
              matchesFilter(entity, otherFilters as FilterQuery<T>),
            );
          }
        } else {
          // Fallback to simple substring match
          entities = getAllEntities().filter((entity) => matchesFilter(entity, filter));
        }
      } else {
        entities = getAllEntities().filter((entity) => matchesFilter(entity, filter));
      }

      // Apply sorting
      if (options?.sort && options.sort.length > 0) {
        entities.sort((a, b) => {
          for (const { key, value: direction } of options.sort!) {
            const aVal = a[key as keyof T];
            const bVal = b[key as keyof T];

            if (aVal === bVal) continue;
            if (aVal === null || aVal === undefined) return direction === 'ASC' ? -1 : 1;
            if (bVal === null || bVal === undefined) return direction === 'ASC' ? 1 : -1;

            const comparison = aVal < bVal ? -1 : 1;
            return direction === 'ASC' ? comparison : -comparison;
          }
          return 0;
        });
      }

      // Apply pagination
      if (options?.offset) {
        entities = entities.slice(options.offset);
      }
      if (options?.limit) {
        entities = entities.slice(0, options.limit);
      }

      return entities;
    },

    async insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<InsertResult> {
      const id = doc._id || generateId();
      const row = entityToRow({ ...doc, _id: id });
      tinybaseStore.setRow(tableName, id, row);
      invalidateFuseIndex();
      return { insertedId: id };
    },

    async insertMany(docs: (Omit<T, '_id'> & { _id?: string })[]): Promise<InsertManyResult> {
      const insertedIds: string[] = [];

      for (const doc of docs) {
        const id = doc._id || generateId();
        insertedIds.push(id);
        const row = entityToRow({ ...doc, _id: id });
        tinybaseStore.setRow(tableName, id, row);
      }

      invalidateFuseIndex();
      return { insertedIds, insertedCount: insertedIds.length };
    },

    async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateResult> {
      const entity = await this.findOne(filter);
      if (!entity) {
        return { matchedCount: 0, modifiedCount: 0 };
      }

      let updated = { ...entity };

      if (update.$set) {
        updated = { ...updated, ...update.$set };
      }

      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) {
          delete (updated as Record<string, unknown>)[key];
        }
      }

      if (update.$inc) {
        for (const [key, amount] of Object.entries(update.$inc)) {
          const currentValue = (updated as Record<string, unknown>)[key];
          (updated as Record<string, unknown>)[key] =
            ((currentValue as number) || 0) + (amount as number);
        }
      }

      const row = entityToRow(updated);
      tinybaseStore.setRow(tableName, entity._id, row);
      invalidateFuseIndex();

      return { matchedCount: 1, modifiedCount: 1 };
    },

    async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateResult> {
      const entities = await this.find(filter);
      let modifiedCount = 0;

      for (const entity of entities) {
        let updated = { ...entity };

        if (update.$set) {
          updated = { ...updated, ...update.$set };
        }

        if (update.$unset) {
          for (const key of Object.keys(update.$unset)) {
            delete (updated as Record<string, unknown>)[key];
          }
        }

        if (update.$inc) {
          for (const [key, amount] of Object.entries(update.$inc)) {
            const currentValue = (updated as Record<string, unknown>)[key];
            (updated as Record<string, unknown>)[key] =
              ((currentValue as number) || 0) + (amount as number);
          }
        }

        const row = entityToRow(updated);
        tinybaseStore.setRow(tableName, entity._id, row);
        modifiedCount++;
      }

      if (modifiedCount > 0) invalidateFuseIndex();
      return { matchedCount: entities.length, modifiedCount };
    },

    async deleteOne(filter: FilterQuery<T>): Promise<DeleteResult> {
      const entity = await this.findOne(filter);
      if (!entity) {
        return { deletedCount: 0 };
      }

      tinybaseStore.delRow(tableName, entity._id);
      invalidateFuseIndex();
      return { deletedCount: 1 };
    },

    async deleteMany(filter: FilterQuery<T>): Promise<DeleteResult> {
      const entities = await this.find(filter);
      for (const entity of entities) {
        tinybaseStore.delRow(tableName, entity._id);
      }
      if (entities.length > 0) invalidateFuseIndex();
      return { deletedCount: entities.length };
    },

    async countDocuments(filter?: FilterQuery<T>): Promise<number> {
      if (!filter || Object.keys(filter).length === 0) {
        return Object.keys(tinybaseStore.getTable(tableName)).length;
      }
      const entities = await this.find(filter);
      return entities.length;
    },

    async distinct<K extends keyof T>(field: K, filter?: FilterQuery<T>): Promise<T[K][]> {
      const entities = filter ? await this.find(filter) : getAllEntities();
      const values = new Set<T[K]>();
      for (const entity of entities) {
        if (entity[field] !== undefined) {
          values.add(entity[field]);
        }
      }
      return Array.from(values);
    },

    // Reactive subscriptions - the key feature of TinyBase!
    subscribe(filter: FilterQuery<T>, callback: (docs: T[]) => void): Unsubscribe {
      // Initial callback with current data
      this.find(filter).then(callback);

      // Listen for table changes
      const listenerId = tinybaseStore.addTableListener(tableName, () => {
        this.find(filter).then(callback);
      });

      return () => {
        tinybaseStore.delListener(listenerId);
      };
    },

    subscribeOne(filter: FilterQuery<T>, callback: (doc: T | null) => void): Unsubscribe {
      // Initial callback
      this.findOne(filter).then(callback);

      // For _id filter, listen to specific row
      if ('_id' in filter && typeof filter._id === 'string') {
        const listenerId = tinybaseStore.addRowListener(tableName, filter._id, () => {
          this.findOne(filter).then(callback);
        });
        return () => tinybaseStore.delListener(listenerId);
      }

      // Otherwise, listen to entire table
      const listenerId = tinybaseStore.addTableListener(tableName, () => {
        this.findOne(filter).then(callback);
      });

      return () => {
        tinybaseStore.delListener(listenerId);
      };
    },
  };
}

/**
 * Create a TinyBase store with optional IndexedDB persistence.
 */
export async function createTinyBaseStore(config?: TinyBaseConfig): Promise<IStore> {
  await ensureTinyBaseLoaded();

  const tinybaseStore = createStore();
  const tables = new Map<string, ITable<Entity>>();
  const searchConfigs = config?.searchConfig || {};
  let persister: TinyBasePersister | null = null;

  const store: IStore = {
    environment: config?.environment || 'browser',

    table<T extends Entity>(name: string): ITable<T> {
      if (!tables.has(name)) {
        const searchConfig = searchConfigs[name];
        tables.set(name, createTinyBaseTable<Entity>(tinybaseStore, name, searchConfig));
      }
      return tables.get(name) as ITable<T>;
    },

    async transaction<R>(fn: (store: IStore) => Promise<R>): Promise<R> {
      // TinyBase doesn't have explicit transactions, but changes are atomic per row
      return fn(store);
    },

    async initialize(): Promise<void> {
      // Set up IndexedDB persistence if enabled and available
      const shouldPersist = config?.persist ?? typeof window !== 'undefined';

      if (shouldPersist) {
        const createPersister = await loadIndexedDbPersister();
        if (createPersister) {
          const dbName = config?.name || 'unchained-store';
          persister = createPersister(tinybaseStore, dbName);
          await persister.load();
          await persister.startAutoSave();
        }
      }
    },

    async close(): Promise<void> {
      if (persister) {
        await persister.stopAutoSave();
        await persister.save();
      }
    },
  };

  return store;
}
