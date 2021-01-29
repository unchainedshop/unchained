import { MongoClient } from 'mongodb';

const Collection = function (name) {
  // eslint-disable-next-line no-underscore-dangle
  this._name = name;
};
Collection.prototype.attachSchema = jest.fn();
let insertedDoc;
Collection.prototype.insert = (doc, callback) => {
  // first param is error and second one is inserted doc _id
  insertedDoc = doc;
  return callback(undefined, Date.now());
};
Collection.prototype.update = jest.fn();
Collection.prototype.remove = jest.fn();
Collection.prototype.findOne = () => {
  return insertedDoc;
};
Collection.prototype.find = jest.fn(() => ({
  count: jest.fn(),
  fetch: jest.fn(),
}));
Collection.prototype.helpers = jest.fn();
Collection.prototype.before = {
  insert: jest.fn(),
  update: jest.fn(),
};
Collection.prototype.after = {
  insert: jest.fn(),
  update: jest.fn(),
};
// eslint-disable-next-line no-underscore-dangle
Collection.prototype._ensureIndex = jest.fn();
Collection.prototype.observe = jest.fn();
const Mongo = { Collection };

const RemoteCollectionDriver = jest.fn();
RemoteCollectionDriver.prototype.open = jest.fn().mockReturnThis();
RemoteCollectionDriver.prototype.insert = jest.fn();
RemoteCollectionDriver.prototype.update = jest.fn();
RemoteCollectionDriver.prototype.remove = jest.fn();
RemoteCollectionDriver.prototype.findOne = jest.fn();
RemoteCollectionDriver.prototype.find = jest.fn(() => ({
  count: jest.fn(),
  fetch: jest.fn(),
}));
const defaultRemoteCollectionDriver = async () => {
  const connection = await MongoClient.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 1,
  });
  const db = await connection.db(global.__MONGO_DB_NAME__);

  return {
    mongo: {
      db,
    },
  };
};

const MongoInternals = {
  RemoteCollectionDriver,
  defaultRemoteCollectionDriver,
};

module.exports = {
  Mongo,
  MongoInternals,
};
