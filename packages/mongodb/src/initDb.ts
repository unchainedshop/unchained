import { Db, MongoClient } from 'mongodb';

let zstdEnabled = false;
let mongod;
let mongoClient: MongoClient | null;

try {
  // eslint-disable-next-line
  // @ts-expect-error
  await import('@mongodb-js/zstd');
  zstdEnabled = true;
} catch {
  /* */
}

export const startDb = async () => {
  const { mkdir } = await import('node:fs/promises');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  try {
    await mkdir(`${process.cwd()}/.db`);
  } catch {
    /* */
  }
  try {
    mongod = MongoMemoryServer.create({
      instance:
        process.env.NODE_ENV === 'test'
          ? { dbName: 'test', port: parseInt(process.env.PORT, 10) + 1 }
          : {
              dbPath: `${process.cwd()}/.db`,
              storageEngine: 'wiredTiger',
              port: parseInt(process.env.PORT, 10) + 1,
            },
    });

    const mongoInstance = await mongod;
    if (mongoInstance) {
      return `${mongoInstance.getUri()}${process.env.NODE_ENV === 'test' ? 'test' : 'unchained'}`;
    }
  } catch {
    /* */
  }
  throw new Error(
    "Can't connect to MongoDB: could not start mongodb-memory-server and MONGO_URL env is not set",
  );
};

export const stopDb = async () => {
  try {
    await mongoClient?.close();
    const mongoInstance = await mongod;
    await (mongoInstance as any)?.stop();
  } catch {
    /* */
  }
};

const initDb = async (): Promise<Db> => {
  const url = process.env.MONGO_URL || (await startDb());
  mongoClient = new MongoClient(url, {
    compressors: zstdEnabled ? 'zstd' : undefined,
  });
  await mongoClient.connect();
  const db = mongoClient.db();
  return db;
};

export { initDb };
