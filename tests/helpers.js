import { sql } from '@unchainedshop/store';
import { initializeTestPlatform, shutdownTestPlatform, getServerPort, getDrizzleDb } from './setup.js';
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
import { seedOrdersToDrizzle } from './seeds/orders.js';
import { seedQuotationsToDrizzle } from './seeds/quotations.js';
import { seedFiltersToDrizzle } from './seeds/filters.js';
import { seedAssortmentsToDrizzle } from './seeds/assortments.js';
import { seedBookmarksToDrizzle } from './seeds/bookmark.js';
import { seedEnrollmentsToDrizzle } from './seeds/enrollments.js';
import { seedWorkQueueToDrizzle } from './seeds/work.js';
import { seedEventsToDrizzle } from './seeds/events.js';
import { seedTokensToDrizzle } from './seeds/tokens.js';
import { GraphQLClient } from 'graphql-request';

export { getServerPort, getDrizzleDb } from './setup.js';

export const getServerBaseUrl = () => {
  const port = getServerPort();
  return `http://localhost:${port}`;
};

export const disconnect = async () => {
  // No-op - cleanup happens in globalTeardown
};

// List of all tables to clear before seeding test data
const ALL_TABLES = [
  // Core tables
  'users',
  'web_authn_credentials',
  'push_subscriptions',
  'user_emails_verification',
  'user_login_attempts',
  'user_avatars',
  'products',
  'product_texts',
  'product_media',
  'product_media_texts',
  'product_variations',
  'product_variation_texts',
  'product_assignments',
  'product_bundled_products',
  'product_reviews',
  'product_prices',
  'countries',
  'country_texts',
  'languages',
  'language_texts',
  'currencies',
  'files',
  'bookmarks',
  'delivery_providers',
  'payment_providers',
  'warehousing_providers',
  'tokens',
  'enrollments',
  'enrollment_periods',
  'quotations',
  'filters',
  'filter_texts',
  'filter_options',
  'assortments',
  'assortment_texts',
  'assortment_links',
  'assortment_products',
  'assortment_filters',
  'work_queue',
  'events',
  'orders',
  'order_positions',
  'order_deliveries',
  'order_payments',
  'order_discounts',
  'sessions',
  // FTS tables (virtual tables)
  // 'countries_fts', // Virtual tables can't be deleted with DELETE
  // 'languages_fts',
  // ... etc
];

export const setupDatabase = async () => {
  // Lazy initialization - ensure platform is running
  await initializeTestPlatform();

  const drizzleDb = getDrizzleDb();

  // Clear all tables
  for (const table of ALL_TABLES) {
    try {
      await drizzleDb.run(sql.raw(`DELETE FROM ${table}`));
    } catch {
      // Table may not exist yet, ignore
    }
  }

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
  await seedAssortmentsToDrizzle(drizzleDb);
  await seedWorkQueueToDrizzle(drizzleDb);
  await seedOrdersToDrizzle(drizzleDb);

  // Seed events AFTER other Drizzle seeds to avoid events polluting the test data
  // The seedEventsToDrizzle function clears existing events before seeding
  await seedEventsToDrizzle(drizzleDb);

  // Return array for backwards compatibility with tests using [db] = await setupDatabase()
  return [drizzleDb, null];
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
