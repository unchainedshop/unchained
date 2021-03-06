import { MongoClient, Collection } from 'mongodb';
import { execute, toPromise } from '@apollo/client/core';
import { createUploadLink } from 'apollo-upload-client';
import gql from 'graphql-tag';
import fetch from 'isomorphic-unfetch';
import seedLocaleData from './seeds/locale-data';
import seedUsers, { ADMIN_TOKEN } from './seeds/users';
import seedProducts from './seeds/products';
import seedDeliveries from './seeds/deliveries';
import seedPayments from './seeds/payments';
import seedWarehousings from './seeds/warehousings';
import seedOrders from './seeds/orders';
import seedQuotations from './seeds/quotations';
import seedFilters from './seeds/filters';
import seedLogs from './seeds/logs';
import seedAssortments from './seeds/assortments';
import seedBookmarks from './seeds/bookmark';
import seedSubscription from './seeds/subscriptions';
import seedWorkQueue from './seeds/work';

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

let connection;

export const getConnection = () => connection;

const connect = async () => {
  if (connection) return;
  const connectionUri =
    (await global.__MONGOD__?.getUri()) || global.__MONGO_URI__;
  connection = await MongoClient.connect(connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 1,
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
  await seedLogs(db);
  await seedAssortments(db);
  await seedBookmarks(db);
  await seedSubscription(db);
  await seedWorkQueue(db);

  return [db, connection];
};

export const wipeDatabase = async () => {
  await connect();
  const db = await connection.db(global.__MONGO_DB_NAME__);
  const collections = await db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  try {
    await connection.close();
  } catch (e) {
    console.warn(e); // eslint-disable-line
  }
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

export const createAnonymousGraphqlFetch = () => {
  const uri = 'http://localhost:3000/graphql';
  const link = createUploadLink({
    uri,
    fetch,
  });
  return convertLinkToFetch(link);
};

export const createLoggedInGraphqlFetch = (token = ADMIN_TOKEN) => {
  const uri = 'http://localhost:3000/graphql';
  const link = createUploadLink({
    uri,
    fetch,
    headers: {
      authorization: token,
    },
  });
  return convertLinkToFetch(link);
};

export const uploadFormData = async ({ token = '', body }) => {
  const options = token
    ? {
        headers: {
          authorization: token,
        },
      }
    : {};
  return fetch('http://localhost:3000/graphql', {
    ...options,
    method: 'POST',
    body,
  }).then((response) => response.json());
};
