import { MongoClient, Collection } from 'mongodb';
import { execute, toPromise, gql } from '@apollo/client/core/index.js';

import seedLocaleData from './seeds/locale-data.js';
import seedUsers, { ADMIN_TOKEN } from './seeds/users.js';
import seedProducts from './seeds/products.js';
import seedDeliveries from './seeds/deliveries.js';
import seedPayments from './seeds/payments.js';
import seedWarehousings from './seeds/warehousings.js';
import seedOrders from './seeds/orders.js';
import seedQuotations from './seeds/quotations.js';
import seedFilters from './seeds/filters.js';
import seedAssortments from './seeds/assortments.js';
import seedBookmarks from './seeds/bookmark.js';
import seedEnrollment from './seeds/enrollments.js';
import seedWorkQueue from './seeds/work.js';

Collection.prototype.findOrInsertOne = async function findOrInsertOne(doc, ...args) {
  try {
    const { insertedId } = await this.insertOne(doc, ...args);
    return this.findOne({ _id: insertedId }, ...args);
  } catch (e) {
    return this.findOne({ _id: doc._id }, ...args);
  }
};

let connection;

export const getConnection = () => connection;

export const disconnect = async () => {
  await connection.close();
};

export const connect = async () => {
  const connectionUri = (await global.__MONGOD__?.getUri()) || global.__MONGO_URI__;
  connection = await MongoClient.connect(connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

export const setupDatabase = async () => {
  await connect();
  const db = await connection.db(global.__MONGO_DB_NAME__);
  const collections = await db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));

  await seedLocaleData(db);
  await seedUsers(db);
  await seedProducts(db);
  await seedDeliveries(db);
  await seedPayments(db);
  await seedWarehousings(db);
  await seedOrders(db);
  await seedQuotations(db);
  await seedFilters(db);
  await seedAssortments(db);
  await seedBookmarks(db);
  await seedEnrollment(db);
  await seedWorkQueue(db);

  return [db, connection];
};

export const wipeDatabase = async () => {
  await connect();
  const db = await connection.db(global.__MONGO_DB_NAME__);
  const collections = await db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

const convertLinkToFetch =
  (link) =>
  ({ query, ...operation }) =>
    toPromise(
      execute(link, {
        query: gql(query),
        ...operation,
      }),
    );

export const createAnonymousGraphqlFetch = async () => {
  const uri = 'http://localhost:4010/graphql';
  const createUploadLink = (await import('apollo-upload-client/createUploadLink.mjs')).default;

  const link = createUploadLink({
    uri,
    includeExtensions: true,
    fetchOptions: {
      duplex: 'half',
    },
    headers: {
      'apollo-require-preflight': true,
    },
  });
  return convertLinkToFetch(link);
};

export const createLoggedInGraphqlFetch = async (token = ADMIN_TOKEN) => {
  const uri = 'http://localhost:4010/graphql';
  const createUploadLink = (await import('apollo-upload-client/createUploadLink.mjs')).default;

  const link = createUploadLink({
    uri,
    includeExtensions: true,
    fetchOptions: {
      duplex: 'half',
    },
    headers: {
      authorization: token,
      'apollo-require-preflight': true,
    },
  });
  return convertLinkToFetch(link);
};

export const putFile = async (file, url) => {
  const response = await fetch(url, {
    method: 'PUT',
    duplex: 'half',
    body: file,
  });
  if (response.ok) {
    return Promise.resolve({});
  }
  return Promise.reject(new Error('error'));
};
