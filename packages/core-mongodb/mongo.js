import { MongoInternals } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { DDP } from 'meteor/ddp';

const DB = {}

DB.Collection = function Collaction(name) {
  if (!name) {
    throw new Error(
      'DB.Collection: Name is required and cannot be null or undefined'
    );
  }

  
  this._driver = MongoInternals.defaultRemoteCollectionDriver();
  this._collection = this._driver.open(
    name,
    this._connection
  );
  this._name = name;
  
  this._makeNewID = function () {
    var src = name ? DDP.randomStream('/collection/' + name) : Random.insecure;
    return src.id();
  };


}

Object.assign(DB.Collection.prototype, {
  attachSchema: (s) => {},
  update: (id, doc) => {},
  insert: (id, doc) => {},
  find: async () =>  
})

