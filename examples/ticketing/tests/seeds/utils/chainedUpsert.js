const makeUpsert = (db) => async (collectionName, entity) =>
  db.collection(collectionName).findOrInsertOne(entity);

export default (db) => {
  const upsert = makeUpsert(db);
  const operations = [];
  const commandMap = {};

  commandMap.resolve = async () => {
    await Promise.all(operations);
    operations.splice(0, operations.length);
  };
  commandMap.upsert = (...props) => {
    operations.push(upsert(...props));
    return commandMap;
  };

  return commandMap;
};
