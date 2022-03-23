import { MongoInternals } from 'meteor/mongo';
import { Db /* MongoClient */ } from 'mongodb';
import { NpmModuleMongodb } from 'meteor/npm-mongo';
// const url = process.env.MONGO_URL || 'mongodb://localhost:4011';

// const initDbNative = async (): Promise<Db> => {
//   const client = new MongoClient(url);

//   const dbName = 'meteor';
//   await client.connect();
//   const db = client.db(dbName);
//   return db;
// };
const originalFn = NpmModuleMongodb.Collection.prototype.updateOne;
NpmModuleMongodb.Collection.prototype.updateOne = async function updateOne(...rest) {
  const result = await originalFn.bind(this)(...rest);
  return {
    result: { nModified: result.modifiedCount },
    ...result,
  };
};

const initDbMeteor = async (): Promise<Db> => {
  return MongoInternals.defaultRemoteCollectionDriver().mongo.db as Db;
};

const initDb = initDbMeteor;

export { initDb };
