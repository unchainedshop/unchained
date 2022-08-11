import { mkdirSync } from 'fs';
import { Db, MongoClient } from 'mongodb';

let mongod;

export const startDb = async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');

  try {
    mkdirSync(`${process.cwd()}/.db`);
  } catch (e) {
    //
  }
  console.log(`Local MongoDB Server Data: ${`${process.cwd()}/.db`}`);
  mongod = await MongoMemoryServer.create({
    instance: {
      dbPath: `${process.cwd()}/.db`,
      storageEngine: 'wiredTiger',
    },
  });
  return `${mongod.getUri()}unchained`;
};

export const stopDb = async () => {
  await mongod.stop();
};

const initDbNative = async (): Promise<Db> => {
  const url = process.env.MONGO_URL || (await startDb());
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db();
  return db;
};

// eslint-disable-next-line
// @ts-ignore
const isMeteor = typeof Meteor === 'object';

if (isMeteor) {
  const { NpmModuleMongodb } = require('meteor/npm-mongo'); // eslint-disable-line
  const originalFn = NpmModuleMongodb.Collection.prototype.updateOne;
  NpmModuleMongodb.Collection.prototype.updateOne = async function updateOne(...rest) {
    const result = await originalFn.bind(this)(...rest);
    if (!result) return result;
    return {
      result: { nModified: result.modifiedCount },
      ...result,
    };
  };
}

const initDbMeteor = async (): Promise<Db> => {
  const { MongoInternals } = require('meteor/mongo'); // eslint-disable-line
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db; // eslint-disable-line
  return db;
};

const initDb = isMeteor ? initDbMeteor : initDbNative;

export { initDb };
