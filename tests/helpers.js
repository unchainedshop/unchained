const { MongoClient, Collection } = require('mongodb');
const { createApolloFetch } = require('apollo-fetch');
const { Admin, User, ADMIN_TOKEN } = require('./seeds/users');

Collection.prototype.findOrInsertOne = async function findOrInsertOne(
  doc,
  ...args
) {
  try {
    const { insertedId } = await this.insertOne(doc, ...args);
    return this.findOne({ _id: insertedId }, ...args);
  } catch (e) {
    return this.findOne({ _id: doc._id }, ...args);
  }
};

module.exports.setupDatabase = async () => {
  const connection = await MongoClient.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    poolSize: 1
  });
  const db = await connection.db(global.__MONGO_DB_NAME__);
  const users = db.collection('users');
  await users.findOrInsertOne(Admin);
  await users.findOrInsertOne(User);
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

module.exports.createAnonymousApolloFetch = () => {
  const apolloFetch = createApolloFetch({
    uri: 'http://localhost:3000/graphql'
  });
  return apolloFetch;
};

module.exports.createAdminApolloFetch = (token = ADMIN_TOKEN) => {
  const apolloFetch = createApolloFetch({
    uri: 'http://localhost:3000/graphql'
  });
  apolloFetch.use(({ options }, next) => {
    if (!options.headers) {
      options.headers = {}; // eslint-disable-line
    }
    options.headers.authorization = token; // eslint-disable-line
    next();
  });
  return apolloFetch;
};
