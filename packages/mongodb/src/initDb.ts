import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';

let zstdEnabled = false;
let mongod;
let mongoClient: MongoClient | null;

const { PORT = '4010' } = process.env;

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
  } catch {
    /* */
  }

  throw new Error(
    "Can't connect to MongoDB: Could not start mongodb-memory-server and MONGO_URL env is not set",
  );
};

export const stopDb = async () => {
  try {
    await mongoClient?.close();
    await (await mongod)?.stop();
  } catch {
    /* */
  }
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
