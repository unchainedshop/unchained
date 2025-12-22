import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import type { MongoMemoryServer } from 'mongodb-memory-server';

let zstdEnabled = false;
let mongod: Promise<MongoMemoryServer> | null = null;
let mongoClient: MongoClient | null = null;

const { PORT = '4010' } = process.env;

const CLEANUP_TIMEOUT_MS = 10000;

try {
  // eslint-disable-next-line
  // @ts-expect-error
  await import('@mongodb-js/zstd');
  zstdEnabled = true;
} catch {
  /* */
}

export const startDb = async (options?: { forceInMemory?: boolean }) => {
  const { mkdir } = await import('node:fs/promises');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const useInMemory = options?.forceInMemory || process.env.NODE_ENV === 'test';

  if (!useInMemory) {
    try {
      await mkdir(`${process.cwd()}/.db`);
    } catch {
      /* */
    }
  }
  try {
    mongod = MongoMemoryServer.create({
      instance: useInMemory
        ? { dbName: 'test', port: parseInt(PORT, 10) + 1, storageEngine: 'ephemeralForTest' }
        : {
            dbPath: `${process.cwd()}/.db`,
            storageEngine: 'wiredTiger',
            port: parseInt(PORT, 10) + 1,
          },
    });
    const mongoInstance = await mongod;
    if (mongoInstance) {
      return `${mongoInstance.getUri()}${useInMemory ? 'test' : 'unchained'}`;
    }
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes('code "62"')) {
      throw new Error(
        `MongoDB database files in .db are incompatible with the current MongoDB version. ` +
          `This usually happens after a MongoDB upgrade. ` +
          `To fix this, remove the .db directory: rm -rf ${process.cwd()}/.db`,
      );
    }
    throw error;
  }

  throw new Error(
    "Can't connect to MongoDB: Could not start mongodb-memory-server and MONGO_URL env is not set",
  );
};

export const stopDb = async () => {
  const cleanup = async () => {
    await mongoClient?.close();
    const server = await mongod;
    // Use force: true to ensure mongod process is killed even if graceful shutdown fails
    await server?.stop({ doCleanup: true, force: true });
  };

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database cleanup timeout')), CLEANUP_TIMEOUT_MS),
  );

  try {
    await Promise.race([cleanup(), timeout]);
  } catch {
    // Timeout or error - attempt force stop as last resort
    const server = await mongod;
    await server?.stop({ force: true }).catch(() => {});
  } finally {
    mongoClient = null;
    mongod = null;
  }
};

/**
 * Database resource implementing AsyncDisposable for use with `await using`.
 * Useful for tests and scoped database access with automatic cleanup.
 *
 * @example
 * ```typescript
 * await using dbResource = await createDatabaseResource();
 * const db = dbResource.db;
 * // db automatically cleaned up when scope exits
 * ```
 */
export interface DatabaseResource extends AsyncDisposable {
  db: Db;
  client: MongoClient;
}

export const createDatabaseResource = async (options?: {
  forceInMemory?: boolean;
}): Promise<DatabaseResource> => {
  const url = options?.forceInMemory
    ? await startDb({ forceInMemory: true })
    : process.env.MONGO_URL || (await startDb());

  mongoClient = new MongoClient(url, {
    compressors: zstdEnabled ? 'zstd' : undefined,
  });
  await mongoClient.connect();
  const db = mongoClient.db();

  return {
    db,
    client: mongoClient,
    [Symbol.asyncDispose]: stopDb,
  };
};

const initDb = async (options?: { forceInMemory?: boolean }): Promise<Db> => {
  const url = options?.forceInMemory
    ? await startDb({ forceInMemory: true })
    : process.env.MONGO_URL || (await startDb());
  mongoClient = new MongoClient(url, {
    compressors: zstdEnabled ? 'zstd' : undefined,
  });
  await mongoClient.connect();
  const db = mongoClient.db();
  return db;
};

export { initDb };
