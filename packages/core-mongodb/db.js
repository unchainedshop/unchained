import { Mongo, MongoInternals } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { DDP } from 'meteor/ddp';
import { configureCollection2 } from './collection2';

const db = Mongo

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

export { db }