import { sql } from '@unchainedshop/store';
import { signAccessToken } from '@unchainedshop/api/lib/auth.js';
import { initializeTestPlatform, shutdownTestPlatform } from './setup.js';
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

/** Helper to create a JWT token for a user ID */
export const createJWTToken = (userId, tokenVersion = 1) => {
  const { token } = signAccessToken(userId, tokenVersion);
  return `Bearer ${token}`;
};

/** Helper to upload a file via PUT request */
export const putFile = async (file, { url, type }) => {
  const signal = AbortSignal.timeout(5000);
  const response = await fetch(url, {
    signal,
    method: 'PUT',
    body: file,
    // @ts-expect-error - duplex is required for streaming but not in types
    duplex: 'half',
    headers: type ? { 'Content-Type': type } : undefined,
  });
  if (response.ok) {
    return response.text();
  }
  const errorText = await response.text().catch(() => 'Could not read error body');
  return Promise.reject(
    new Error(`PUT ${url} failed: ${response.status} ${response.statusText} - ${errorText}`),
  );
};

// List of all tables to clear before seeding test data
const ALL_TABLES = [
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
];

// Test context - initialized once per process
let testContext = null;

async function seedDatabaseTables(drizzleDb) {
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
  await seedEventsToDrizzle(drizzleDb);
}

/**
 * Initialize test platform and seed database.
 * Returns a context object with all test utilities:
 * - db: Drizzle database instance
 * - port: Server port number
 * - createLoggedInGraphqlFetch(token?): Create a GraphQL fetch function with auth
 * - createAnonymousGraphqlFetch(): Create a GraphQL fetch function without auth
 *
 * Safe to call multiple times - will reuse existing context and re-seed database.
 */
export const setupDatabase = async () => {
  // Reuse existing context if already initialized
  if (testContext) {
    // Re-seed database for fresh test data
    await seedDatabaseTables(testContext.db);
    return testContext;
  }

  // Initialize platform (creates server and database)
  const { db, port } = await initializeTestPlatform();

  // Seed database
  await seedDatabaseTables(db);

  // Create graphql fetch factory (standalone function, no `this` binding needed)
  const createLoggedInGraphqlFetch = (token = ADMIN_TOKEN) => {
    const client = new GraphQLClient(`http://localhost:${port}/graphql`, {
      errorPolicy: 'all',
    });
    return async ({ query, headers, ...options }) =>
      client.rawRequest({
        query,
        requestHeaders: token ? { authorization: token, ...(headers || {}) } : headers,
        ...options,
      });
  };

  const createAnonymousGraphqlFetch = () => createLoggedInGraphqlFetch(null);

  // Create context with all test utilities
  testContext = {
    db,
    port,
    createLoggedInGraphqlFetch,
    createAnonymousGraphqlFetch,
  };

  return testContext;
};

/** Disconnect from test platform and clean up resources. */
export const disconnect = async () => {
  if (testContext) {
    await shutdownTestPlatform();
    testContext = null;
  }
};
