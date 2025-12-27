/**
 * Memory adapter for @unchainedshop/store.
 * Stores data in memory - useful for testing and development.
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
 * Check if a value matches a filter operator.
 */
function matchesOperator<V>(value: V, operator: Record<string, unknown>): boolean {
  for (const [op, opValue] of Object.entries(operator)) {
    switch (op) {
      case '$eq':
        if (value !== opValue) return false;
        break;
      case '$ne':
        if (value === opValue) return false;
        break;
      case '$gt':
        if (!(value > (opValue as V))) return false;
        break;
      case '$gte':
        if (!(value >= (opValue as V))) return false;
        break;
      case '$lt':
        if (!(value < (opValue as V))) return false;
        break;
      case '$lte':
        if (!(value <= (opValue as V))) return false;
        break;
      case '$in':
        if (!Array.isArray(opValue) || !opValue.includes(value)) return false;
        break;
      case '$nin':
        if (Array.isArray(opValue) && opValue.includes(value)) return false;
        break;
      case '$exists':
        if (opValue && value === undefined) return false;
        if (!opValue && value !== undefined) return false;
        break;
      case '$regex':
        if (typeof value !== 'string' || !new RegExp(opValue as string).test(value)) return false;
        break;
    }
  }
  return true;
}

/**
 * Check if a document matches a filter query.
 */
function matchesFilter<T extends Entity>(doc: T, filter: FilterQuery<T>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (key === '$and') {
      const conditions = value as FilterQuery<T>[];
      if (!conditions.every((cond) => matchesFilter(doc, cond))) return false;
    } else if (key === '$or') {
      const conditions = value as FilterQuery<T>[];
      if (!conditions.some((cond) => matchesFilter(doc, cond))) return false;
    } else if (key === '$text') {
      // Simple text search - search all string fields
      const searchText = ((value as { $search: string }).$search || '').toLowerCase();
      const docString = JSON.stringify(doc).toLowerCase();
      if (!docString.includes(searchText)) return false;
    } else {
      const docValue = doc[key as keyof T];
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // It's an operator object
        if (!matchesOperator(docValue, value as Record<string, unknown>)) return false;
      } else {
        // Direct value comparison
        if (docValue !== value) return false;
      }
    }
  }
  return true;
}

/**
 * Apply update operators to a document.
 */
function applyUpdate<T extends Entity>(doc: T, update: UpdateQuery<T>): T {
  const result = { ...doc };

  if (update.$set) {
    Object.assign(result, update.$set);
  }

  if (update.$unset) {
    for (const key of Object.keys(update.$unset)) {
      delete result[key as keyof T];
    }
  }

  if (update.$inc) {
    for (const [key, amount] of Object.entries(update.$inc)) {
      const currentValue = result[key as keyof T] as number;
      (result as Record<string, unknown>)[key] = (currentValue || 0) + (amount as number);
    }
  }

  if (update.$push) {
    for (const [key, value] of Object.entries(update.$push)) {
      const currentArray = (result[key as keyof T] as unknown[]) || [];
      (result as Record<string, unknown>)[key] = [...currentArray, value];
    }
  }

  if (update.$pull) {
    for (const [key, value] of Object.entries(update.$pull)) {
      const currentArray = (result[key as keyof T] as unknown[]) || [];
      (result as Record<string, unknown>)[key] = currentArray.filter((item) => item !== value);
    }
  }

  return result;
}

/**
 * Sort documents by the given options.
 */
function sortDocuments<T extends Entity>(docs: T[], options?: FindOptions): T[] {
  if (!options?.sort || options.sort.length === 0) return docs;

  return [...docs].sort((a, b) => {
    for (const { key, value: direction } of options.sort!) {
      const aVal = a[key as keyof T];
      const bVal = b[key as keyof T];

      if (aVal === bVal) continue;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return direction === 'ASC' ? comparison : -comparison;
    }
    return 0;
  });
}

/**
 * Create a memory table.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createMemoryTable<T extends Entity>(_tableName: string): ITable<T> {
  const documents = new Map<string, T>();

  return {
    async findOne(filter: FilterQuery<T>): Promise<T | null> {
      for (const doc of documents.values()) {
        if (matchesFilter(doc, filter)) return doc;
      }
      return null;
    },

    async find(filter: FilterQuery<T>, options?: FindOptions): Promise<T[]> {
      let results = Array.from(documents.values()).filter((doc) => matchesFilter(doc, filter));

      results = sortDocuments(results, options);

      if (options?.offset) {
        results = results.slice(options.offset);
      }
      if (options?.limit) {
        results = results.slice(0, options.limit);
      }

      return results;
    },

    async insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<InsertResult> {
      const id = doc._id || generateId();
      const fullDoc = { ...doc, _id: id } as T;
      documents.set(id, fullDoc);
      return { insertedId: id };
    },

    async insertMany(docs: (Omit<T, '_id'> & { _id?: string })[]): Promise<InsertManyResult> {
      const insertedIds: string[] = [];
      for (const doc of docs) {
        const id = doc._id || generateId();
        const fullDoc = { ...doc, _id: id } as T;
        documents.set(id, fullDoc);
        insertedIds.push(id);
      }
      return { insertedIds, insertedCount: insertedIds.length };
    },

    async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateResult> {
      for (const [id, doc] of documents) {
        if (matchesFilter(doc, filter)) {
          const updated = applyUpdate(doc, update);
          documents.set(id, updated);
          return { matchedCount: 1, modifiedCount: 1 };
        }
      }
      return { matchedCount: 0, modifiedCount: 0 };
    },

    async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateResult> {
      let matchedCount = 0;
      for (const [id, doc] of documents) {
        if (matchesFilter(doc, filter)) {
          const updated = applyUpdate(doc, update);
          documents.set(id, updated);
          matchedCount++;
        }
      }
      return { matchedCount, modifiedCount: matchedCount };
    },

    async deleteOne(filter: FilterQuery<T>): Promise<DeleteResult> {
      for (const [id, doc] of documents) {
        if (matchesFilter(doc, filter)) {
          documents.delete(id);
          return { deletedCount: 1 };
        }
      }
      return { deletedCount: 0 };
    },

    async deleteMany(filter: FilterQuery<T>): Promise<DeleteResult> {
      let deletedCount = 0;
      for (const [id, doc] of documents) {
        if (matchesFilter(doc, filter)) {
          documents.delete(id);
          deletedCount++;
        }
      }
      return { deletedCount };
    },

    async countDocuments(filter?: FilterQuery<T>): Promise<number> {
      if (!filter || Object.keys(filter).length === 0) {
        return documents.size;
      }
      return Array.from(documents.values()).filter((doc) => matchesFilter(doc, filter)).length;
    },

    async distinct<K extends keyof T>(field: K, filter?: FilterQuery<T>): Promise<T[K][]> {
      const values = new Set<T[K]>();
      for (const doc of documents.values()) {
        if (!filter || matchesFilter(doc, filter)) {
          if (doc[field] !== undefined) {
            values.add(doc[field]);
          }
        }
      }
      return Array.from(values);
    },
  };
}

/**
 * Create a memory store.
 */
export async function createMemoryStore(config?: StoreConfig): Promise<IStore> {
  const tables = new Map<string, ITable<Entity>>();
  let version = 0;

  const store: IStore = {
    environment: config?.environment || 'server',

    table<T extends Entity>(name: string): ITable<T> {
      if (!tables.has(name)) {
        tables.set(name, createMemoryTable<Entity>(name));
      }
      return tables.get(name) as ITable<T>;
    },

    async transaction<R>(fn: (store: IStore) => Promise<R>): Promise<R> {
      // Memory store doesn't support real transactions,
      // just execute the function
      return fn(store);
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getChangesSince(_sinceVersion: number): Promise<[]> {
      // Memory store doesn't track changes
      return [];
    },

    async applyChanges(): Promise<void> {
      // No-op for memory store
    },

    getCurrentVersion(): number {
      return version++;
    },

    async initialize(): Promise<void> {
      // No initialization needed for memory store
    },

    async close(): Promise<void> {
      tables.clear();
    },
  };

  return store;
}
