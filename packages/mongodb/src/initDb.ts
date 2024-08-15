import { mkdirSync } from 'fs';
import { Db, MongoClient } from 'mongodb';

let mongod;

export const startDb = async () => {
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
};

export const stopDb = async () => {
  await mongod.stop();
};

const initDb = async (): Promise<Db> => {
  const url = process.env.MONGO_URL || (await startDb());
  const client = new MongoClient(url, {
    compressors: 'zstd',
  });
  await client.connect();
  const db = client.db();
  return db;
};

export { initDb };
