/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import { MongoClient, Collection } from 'mongodb';
import { execute, makePromise } from 'apollo-link';
import { createUploadLink } from 'apollo-upload-client';
import gql from 'graphql-tag';
import fetch from 'isomorphic-unfetch';
import seedUsers, { ADMIN_TOKEN } from './seeds/users';
import seedProducts from './seeds/products';
import seedDeliveries from './seeds/deliveries';
import seedPayments from './seeds/payments';
import seedWarehousings from './seeds/warehousings';
import seedOrders from './seeds/orders';
import seedQuotations from './seeds/quotations';
import seedFilters from './seeds/filters';

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

const clearCollections = async db => {
  const collections = await db.collections();
  return Promise.all(
    collections.map(async collection => {
      return collection.deleteMany({});
    })
  );
};

export const setupDatabase = async () => {
  const connection = await MongoClient.connect(global.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 1
  });
  const db = await connection.db(global.__MONGO_DB_NAME__);
  await clearCollections(db);
  await seedUsers(db);
  await seedProducts(db);
  await seedDeliveries(db);
  await seedPayments(db);
  await seedWarehousings(db);
  await seedOrders(db);
  await seedQuotations(db);
  await seedFilters(db);

  return [db, connection];
};

export const wipeDatabase = async () => {
  const connectionUri = await global.__MONGOD__.getConnectionString();
  const connection = await MongoClient.connect(connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const db = await connection.db(global.__MONGO_DB_NAME__);
  await clearCollections(db);
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
  const link = createUploadLink({
    uri,
    fetch
  });
  return convertLinkToFetch(link);
};

export const createLoggedInGraphqlFetch = (token = ADMIN_TOKEN) => {
  const uri = 'http://localhost:3000/graphql';
  const link = createUploadLink({
    uri,
    fetch,
    headers: {
      authorization: token
    }
  });
  return convertLinkToFetch(link);
};
