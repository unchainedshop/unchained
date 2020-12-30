const Collection = function (name) {
  this._name = name;
};
Collection.prototype.attachSchema = jest.fn();
Collection.prototype.insert = jest.fn();
Collection.prototype.update = jest.fn();
Collection.prototype.remove = jest.fn();
Collection.prototype.findOne = jest.fn();
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
const MongoInternals = { RemoteCollectionDriver };

module.exports = {
  Mongo,
  MongoInternals,
};
