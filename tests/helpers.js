import { MongoClient, Collection } from 'mongodb';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';
import fetch from 'isomorphic-unfetch';
import { Admin, User, ADMIN_TOKEN } from './seeds/users';

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

export const setupDatabase = async () => {
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

export const wipeDatabase = async () => {
  const connectionUri = await global.__MONGOD__.getConnectionString();
  const connection = await MongoClient.connect(connectionUri, {
    useNewUrlParser: true
  });
  const db = await connection.db('jest');
  await db.dropDatabase();
  await connection.close();
};

const convertLinkToFetch = link => ({ query, ...operation }) =>
  makePromise(
    execute(link, {
      query: gql(query),
      ...operation
    })
  );

export const createAnonymousGraphqlFetch = () => {
  const uri = 'http://localhost:3000/graphql';
  const link = new HttpLink({
    uri,
    fetch
  });
  return convertLinkToFetch(link);
};

export const createAdminGraphqlFetch = (token = ADMIN_TOKEN) => {
  const uri = 'http://localhost:3000/graphql';
  const link = new HttpLink({
    uri,
    fetch,
    headers: {
      authorization: token
    }
  });
  return convertLinkToFetch(link);
};
