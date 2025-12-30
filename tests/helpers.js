import { Collection } from 'mongodb';
import {
  initializeTestPlatform,
  shutdownTestPlatform,
  getTestPlatform,
  getServerPort,
  getDrizzleDb,
} from './setup.js';
import {
  seedCountriesToDrizzle,
  seedLanguagesToDrizzle,
  seedCurrenciesToDrizzle,
} from './seeds/locale-data.js';
import { ADMIN_TOKEN, seedUsersToDrizzle } from './seeds/users.js';
import { seedMediaObjectsToDrizzle, seedProductsToDrizzle } from './seeds/products.js';
import { seedDeliveryProvidersToDrizzle } from './seeds/deliveries.js';
import { seedPaymentsToDrizzle } from './seeds/payments.js';
import { seedWarehousingProvidersToDrizzle } from './seeds/warehousings.js';
import seedOrders from './seeds/orders.js';
import { seedQuotationsToDrizzle } from './seeds/quotations.js';
import { seedFiltersToDrizzle } from './seeds/filters.js';
import seedAssortments from './seeds/assortments.js';
import { seedBookmarksToDrizzle } from './seeds/bookmark.js';
import { seedEnrollmentsToDrizzle } from './seeds/enrollments.js';
import { seedWorkQueueToDrizzle } from './seeds/work.js';
import { seedEventsToDrizzle } from './seeds/events.js';
import { seedTokensToDrizzle } from './seeds/tokens.js';
import { GraphQLClient } from 'graphql-request';

// eslint-disable-next-line
// @ts-expect-error
Collection.prototype.findOrInsertOne = async function findOrInsertOne(doc, ...args) {
  try {
    const { insertedId } = await this.insertOne(doc, ...args);
    return this.findOne({ _id: insertedId }, ...args);
  } catch {
    return this.findOne({ _id: doc._id }, ...args);
  }
};

let connection;

export { getServerPort, getDrizzleDb } from './setup.js';

export const getConnection = () => connection;
export const getServerBaseUrl = () => {
  const port = getServerPort();
  return `http://localhost:${port}`;
};

export const disconnect = async () => {
  // No-op - cleanup happens in globalTeardown
};

export const setupDatabase = async () => {
  // Lazy initialization - ensure platform is running
  await initializeTestPlatform();

  const { db } = getTestPlatform();
  const drizzleDb = getDrizzleDb();
  const collections = await db.collections();
  await Promise.all(collections.map(async (collection) => collection.deleteMany({})));

  // Seed MongoDB collections that are not yet migrated to Drizzle
  await seedOrders(db);
  await seedAssortments(db);

  // Seed Drizzle tables (bypasses modules to avoid emitting events)
  await seedUsersToDrizzle(drizzleDb);
  await seedProductsToDrizzle(drizzleDb);
  await seedCountriesToDrizzle(drizzleDb);
  await seedLanguagesToDrizzle(drizzleDb);
  await seedCurrenciesToDrizzle(drizzleDb);
  await seedBookmarksToDrizzle(drizzleDb);
  await seedDeliveryProvidersToDrizzle(drizzleDb);
  await seedPaymentsToDrizzle(drizzleDb);
  await seedWarehousingProvidersToDrizzle(drizzleDb);
  await seedTokensToDrizzle(drizzleDb);
  await seedEnrollmentsToDrizzle(drizzleDb);
  await seedQuotationsToDrizzle(drizzleDb);
  await seedMediaObjectsToDrizzle(drizzleDb);
  await seedFiltersToDrizzle(drizzleDb);
  await seedWorkQueueToDrizzle(drizzleDb);

  // Seed events AFTER other Drizzle seeds to avoid events polluting the test data
  // The seedEventsToDrizzle function clears existing events before seeding
  await seedEventsToDrizzle(drizzleDb);

  return [db, null];
};

export const createAnonymousGraphqlFetch = () => {
  return createLoggedInGraphqlFetch(null);
};

export const createLoggedInGraphqlFetch = (token = ADMIN_TOKEN) => {
  const port = getServerPort();
  const client = new GraphQLClient(`http://localhost:${port}/graphql`, {
    errorPolicy: 'all',
  });

  return async ({ query, headers, ...options }) =>
    client.rawRequest({
      query,
      requestHeaders: token
        ? {
            authorization: token,
            ...(headers || {}),
          }
        : headers,
      ...options,
    });
};

export const putFile = async (file, { url, type }) => {
  const signal = AbortSignal.timeout(5000);
  const response = await fetch(url, {
    signal,
    method: 'PUT',
    body: file,
    // eslint-disable-next-line
    // @ts-expect-error
    duplex: 'half',
    headers: type
      ? {
          'Content-Type': type,
        }
      : undefined,
  });
  if (response.ok) {
    return response.text();
  }
  const errorText = await response.text().catch(() => 'Could not read error body');
  return Promise.reject(
    new Error(`PUT ${url} failed: ${response.status} ${response.statusText} - ${errorText}`),
  );
};

export async function globalSetup() {
  await initializeTestPlatform();
  await setupDatabase();
}

export async function globalTeardown() {
  await shutdownTestPlatform();
}

// Node.js test runner global setup:
// - Default export runs as setup
// - Return value is the teardown function
export default async function setup() {
  await globalSetup();
  return globalTeardown;
}
