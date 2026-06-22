import { setTimeout } from 'node:timers/promises';
import { Collection } from 'mongodb';
import {
  initializeTestPlatform,
  shutdownTestPlatform,
  getTestPlatform,
  getServerPort,
} from './setup.js';
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
import seedEvents from './seeds/events.js';
import seedTokens from './seeds/tokens.js';
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

export const getConnection = () => null;

export { getServerPort } from './setup.js';

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
  const collections = await db.collections();
  await Promise.all(collections.map(async (collection) => collection.deleteMany({})));

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
  await seedEvents(db);
  await seedTokens(db);

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

// Poll an already-enqueued work item until it reaches one of `status` (default the
// terminal states), then return the work object. Use this instead of a fixed sleep:
// a sleep races real processing, and a worker that outlives the test can race the next
// test file's reseed (--test-isolation=none shares the process).
export const waitForWork = async (graphqlFetch, workId, { status = ['SUCCESS', 'FAILED'] } = {}) => {
  for (let i = 0; i < 100; i++) {
    const { data: { work } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        query Work($workId: ID!) {
          work(workId: $workId) {
            _id
            status
            started
            type
            worker
          }
        }
      `,
      variables: { workId },
    });
    if (work && status.includes(work.status)) return work;
    await setTimeout(100);
  }
  throw new Error(`Work ${workId} did not reach ${status.join('/')} in time`);
};

// Enqueue a work item, wait for it to finish, and return its terminal status.
export const runWorkToCompletion = async (graphqlFetch, type, input) => {
  const { data } = await graphqlFetch({
    query: /* GraphQL */ `
      mutation AddWork($type: WorkType!, $input: JSON) {
        addWork(type: $type, input: $input) {
          _id
        }
      }
    `,
    variables: { type, input },
  });
  const work = await waitForWork(graphqlFetch, data.addWork._id);
  return work.status;
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
