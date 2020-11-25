const Fiber = require('fibers');
const { MongoClient } = require('mongodb');

module.exports = function ({ url, config, databaseName, collections }) {
  const Collection = function (db, name) {
    this.collection = db.collection(name);
  };

  Collection.prototype.count = function (query, options) {
    query = query || {};
    options = options || {};
    const fiber = Fiber.current;
    this.collection.count(query, options, function (err, records) {
      fiber.run(records);
    });
    return Fiber.yield();
  };

  Collection.prototype.find = function (query, options) {
    query = query || {};
    options = options || {};
    const fiber = Fiber.current;
    this.collection.find(query, options).toArray(function (err, records) {
      fiber.run(records);
    });
    return Fiber.yield();
  };

  Collection.prototype.findOne = function (query, options) {
    return this.find(query, options)[0];
  };

  Collection.prototype.update = function (query, options) {
    const fiber = Fiber.current;
    this.collection.update(query, options, function (err, records) {
      fiber.run(records);
    });
    return Fiber.yield();
  };

  Collection.prototype.insert = function (document) {
    const fiber = Fiber.current;
    this.collection.insert(document, function (err, records) {
      fiber.run(records);
    });
    return Fiber.yield();
  };

  Collection.prototype.remove = function (document) {
    const fiber = Fiber.current;
    this.collection.remove(document, function (err, records) {
      fiber.run(records);
    });
    return Fiber.yield();
  };

  const fiber = Fiber.current;

  MongoClient.connect(url, config, function (err, connection) {
    const obj = {
      close() {
        connection.close();
      },
    };
    const db = connection.db(databaseName);
    collections.forEach(function (collectionName) {
      obj[collectionName] = new Collection(db, collectionName);
    });
    fiber.run(obj);
  });

  return Fiber.yield();
};
