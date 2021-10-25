import { Mongo, MongoInternals } from 'meteor/mongo';
// import { Random } from 'meteor/random';
// import { DDP } from 'meteor/ddp';
import { configureCollection2 } from './configureCollection2';
import { configureIndex } from './configureIndex';

import { MongoClient } from 'mongodb';
import { log, LogTextColor } from './utils/log';
import { Db } from 'mongodb';

// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
// const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
// const client = new MongoClient(url);

const initDb = (): Db => {
  /* TODO
  // Use connect method to connect to the server
  log('Initialise MongoDB database', { color: LogTextColor.Crimson });
  await client.connect();
  log('Client successfully connected', { color: LogTextColor.Crimson });
  const db = client.db(dbName);
  log('Dabase successfully initialised', { color: LogTextColor.Crimson });
  return db
  */
  return MongoInternals.defaultRemoteCollectionDriver().mongo.db as unknown as Db;
};

const db = Mongo;

// mongoDb.Collection = function Collaction(name) {
//   if (!name) {
//     throw new Error(
//       'DB.Collection: Name is required and cannot be null or undefined'
//     );
//   }

//   this._driver = MongoInternals.defaultRemoteCollectionDriver();
//   this._collection = this._driver.open(name, this._connection);
//   this._name = name;

//   this._makeNewID = function () {
//     var src = name ? DDP.randomStream('/collection/' + name) : Random.insecure;
//     return src.id();
//   };
// };

// Object.assign(mongoDb.Collection.prototype, {
//   // Collection API wrappers
//   update: async (id, doc) => {},
//   upsert: async (id, doc) => {},
//   insert: async (doc) => {},
//   remove: async (id) => {},
//   find: async (query) => {},
//   findOne: async (query) => {},
// });

configureCollection2(db);
configureIndex(db);

export { db, initDb };
