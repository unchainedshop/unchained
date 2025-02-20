import { Db, MongoClient } from 'mongodb';

let zstdEnabled = false;
let mongod;

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
  mongod = MongoMemoryServer.create({
    instance: {
      dbPath: `${process.cwd()}/.db`,
      storageEngine: 'wiredTiger',
      port: parseInt(process.env.PORT, 10) + 1,
    },
  }).catch((e) => {
    console.log(e);
    // Drop error
    /* */
  });

  const mongoInstance = await mongod;
  if (!mongoInstance) {
    throw new Error(
      "Can't connect to MongoDB: could not start mongodb-memory-server and MONGO_URL env is not set",
    );
  }
  return `${mongoInstance.getUri()}unchained`;
};

export const stopDb = async () => {
  const mongoInstance = await mongod;
  await (mongoInstance as any)?.stop();
};

const initDb = async (): Promise<Db> => {
  const url = process.env.MONGO_URL || (await startDb());
  const client = new MongoClient(url, {
    compressors: zstdEnabled ? 'zstd' : undefined,
  });
  await client.connect();
  const db = client.db();
  return db;
};

export { initDb };
