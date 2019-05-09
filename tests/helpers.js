const { MongoClient, Collection } = require('mongodb');
const { createApolloFetch } = require('apollo-fetch');
const { Admin, ADMIN_TOKEN } = require('./seeds/users');

Collection.prototype.findOrInsertOne = async function findOrInsertOne(
  doc,
  ...args
) {
  const found = await this.findOne({ _id: doc._id }, ...args);
  if (found) return found;
  return this.insertOne(doc, ...args);
};

module.exports.setupDatabase = async () => {
  const connection = await MongoClient.connect(global.__MONGO_URI__, {
    useNewUrlParser: true
  });
  const db = await connection.db(global.__MONGO_DB_NAME__);
  const users = db.collection('users');
  await users.findOrInsertOne(Admin);
  return [db, connection];
};

module.exports.wipeDatabase = async () => {
  const connectionUri = await global.__MONGOD__.getConnectionString();
  const connection = await MongoClient.connect(connectionUri, {
    useNewUrlParser: true
  });
  const db = await connection.db('jest');
  await db.dropDatabase();
  await connection.close();
};

module.exports.createAdminApolloFetch = () => {
  const apolloFetch = createApolloFetch({
    uri: 'http://localhost:3000/graphql'
  });
  apolloFetch.use(({ options }, next) => {
    if (!options.headers) {
      options.headers = {}; // eslint-disable-line
    }
    options.headers.authorization = ADMIN_TOKEN; // eslint-disable-line
    next();
  });
  return apolloFetch;
};
