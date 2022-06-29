import { Db, MongoClient } from 'mongodb';

const url = process.env.MONGO_URL || 'mongodb://localhost:4011';

const initDbNative = async (): Promise<Db> => {
  const client = new MongoClient(url);

  const dbName = 'meteor';
  await client.connect();
  const db = client.db(dbName);
  return db;
};

const isMeteor = typeof Meteor === "object";

if (isMeteor) {
  const { NpmModuleMongodb } = await import('meteor/npm-mongo');
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
  const { MongoInternals } = await import('meteor/mongo');
  return MongoInternals.defaultRemoteCollectionDriver().mongo.db as Db;
};

const initDb = isMeteor ? initDbMeteor : initDbNative;

export { initDb };
