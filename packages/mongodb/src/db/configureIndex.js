export const configureIndex = (db) => {
  db.Collection.prototype.createIndex = function createIndex(
    name,
    keyPath,
    options
  ) {
    const self = this;

    self.rawCollection().createIndex(name, keyPath, options);
  };
};
