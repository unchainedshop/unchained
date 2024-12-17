import { mkdirSync } from 'fs';
import { Db, MongoClient } from 'mongodb';

let mongod;

export const startDb = async () => {
  try {
    // eslint-disable-next-line
    // @ts-ignore
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    try {
      mkdirSync(`${process.cwd()}/.db`);
    } catch {
      //
    }
    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: `${process.cwd()}/.db`,
        storageEngine: 'wiredTiger',
        port: parseInt(process.env.PORT, 10) + 1,
      },
    });
    return `${mongod.getUri()}unchained`;
  } catch {
    throw new Error(
      "Can't connect to MongoDB: could not start mongodb-memory-server and MONGO_URL env is not set",
    );
  }
};

export const stopDb = async () => {
  await mongod.stop();
};

const initDb = async (): Promise<Db> => {
  let zstdEnabled = false;
  try {
    // eslint-disable-next-line
    // @ts-ignore
    await import('@mongodb-js/zstd');
    zstdEnabled = true;
  } catch {
    /* */
  }

  const url = process.env.MONGO_URL || (await startDb());
  const client = new MongoClient(url, {
    compressors: zstdEnabled ? 'zstd' : undefined,
  });
  await client.connect();
  const db = client.db();
  return db;
};

export { initDb };
