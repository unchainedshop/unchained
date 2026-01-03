import { sql } from '@unchainedshop/store';
import { signAccessToken } from '@unchainedshop/api/lib/auth.js';
import { upsertFTSEntity, clearFTSTable } from '@unchainedshop/plugins/search/fts5-search.js';
import { initializeTestPlatform, shutdownTestPlatform, rebuildSearchIndexes } from './setup.js';
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

// FTS entity types to seed
const FTS_ENTITY_TYPES = [
  'users',
  'products',
  'product_texts',
  'product_reviews',
  'countries',
  'languages',
  'currencies',
  'orders',
  'quotations',
  'enrollments',
  'filters',
  'filter_texts',
  'assortments',
  'assortment_texts',
  'events',
  'work_queue',
  'token_surrogates',
];

async function seedFTSData(drizzleDb) {
  // Clear all FTS tables
  for (const entityType of FTS_ENTITY_TYPES) {
    await clearFTSTable(entityType);
  }

  // Seed users FTS
  const users = await drizzleDb.all(sql`SELECT _id, username FROM users`);
  for (const user of users) {
    await upsertFTSEntity('users', user._id, { _id: user._id, username: user.username || '' });
  }

  // Seed countries FTS
  const countries = await drizzleDb.all(sql`SELECT _id, isoCode, defaultCurrencyCode FROM countries`);
  for (const country of countries) {
    await upsertFTSEntity('countries', country._id, {
      _id: country._id,
      isoCode: country.isoCode || '',
      defaultCurrencyCode: country.defaultCurrencyCode || '',
    });
  }

  // Seed languages FTS
  const languages = await drizzleDb.all(sql`SELECT _id, isoCode FROM languages`);
  for (const language of languages) {
    await upsertFTSEntity('languages', language._id, {
      _id: language._id,
      isoCode: language.isoCode || '',
    });
  }

  // Seed currencies FTS
  const currencies = await drizzleDb.all(sql`SELECT _id, isoCode, contractAddress FROM currencies`);
  for (const currency of currencies) {
    await upsertFTSEntity('currencies', currency._id, {
      _id: currency._id,
      isoCode: currency.isoCode || '',
      contractAddress: currency.contractAddress || '',
    });
  }

  // Seed products FTS
  const products = await drizzleDb.all(sql`SELECT _id, slugs, warehousing FROM products`);
  for (const product of products) {
    const slugs = product.slugs ? JSON.parse(product.slugs) : [];
    const warehousing = product.warehousing ? JSON.parse(product.warehousing) : {};
    await upsertFTSEntity('products', product._id, {
      _id: product._id,
      sku: warehousing.sku || '',
      slugs_text: slugs.join(' '),
    });
  }

  // Seed product_texts FTS
  const productTexts = await drizzleDb.all(
    sql`SELECT _id, productId, title, subtitle, brand, vendor, description, labels, slug FROM product_texts`,
  );
  for (const text of productTexts) {
    const labels = text.labels ? JSON.parse(text.labels) : [];
    await upsertFTSEntity('product_texts', text.productId, {
      _id: text._id,
      productId: text.productId,
      title: text.title || '',
      subtitle: text.subtitle || '',
      brand: text.brand || '',
      vendor: text.vendor || '',
      description: text.description || '',
      labels: labels.join(' '),
      slug: text.slug || '',
    });
  }

  // Seed assortments FTS
  const assortments = await drizzleDb.all(sql`SELECT _id, slugs FROM assortments`);
  for (const assortment of assortments) {
    const slugs = assortment.slugs ? JSON.parse(assortment.slugs) : [];
    await upsertFTSEntity('assortments', assortment._id, {
      _id: assortment._id,
      slugs_text: slugs.join(' '),
    });
  }

  // Seed assortment_texts FTS
  const assortmentTexts = await drizzleDb.all(
    sql`SELECT _id, assortmentId, title, subtitle FROM assortment_texts`,
  );
  for (const text of assortmentTexts) {
    await upsertFTSEntity('assortment_texts', text.assortmentId, {
      _id: text._id,
      assortmentId: text.assortmentId,
      title: text.title || '',
      subtitle: text.subtitle || '',
    });
  }

  // Seed orders FTS
  const orders = await drizzleDb.all(sql`SELECT _id, userId, orderNumber, status, contact FROM orders`);
  for (const order of orders) {
    const contact = order.contact ? JSON.parse(order.contact) : {};
    await upsertFTSEntity('orders', order._id, {
      _id: order._id,
      userId: order.userId || '',
      orderNumber: order.orderNumber || '',
      status: order.status || '',
      emailAddress: contact.emailAddress || '',
      telNumber: contact.telNumber || '',
    });
  }

  // Seed quotations FTS
  const quotations = await drizzleDb.all(
    sql`SELECT _id, userId, quotationNumber, status FROM quotations`,
  );
  for (const quotation of quotations) {
    await upsertFTSEntity('quotations', quotation._id, {
      _id: quotation._id,
      userId: quotation.userId || '',
      quotationNumber: quotation.quotationNumber || '',
      status: quotation.status || '',
    });
  }

  // Seed enrollments FTS
  const enrollments = await drizzleDb.all(
    sql`SELECT _id, userId, enrollmentNumber, status FROM enrollments`,
  );
  for (const enrollment of enrollments) {
    await upsertFTSEntity('enrollments', enrollment._id, {
      _id: enrollment._id,
      userId: enrollment.userId || '',
      enrollmentNumber: enrollment.enrollmentNumber || '',
      status: enrollment.status || '',
    });
  }

  // Seed filters FTS
  const filters = await drizzleDb.all(sql`SELECT _id, key, options FROM filters`);
  for (const filter of filters) {
    const options = filter.options ? JSON.parse(filter.options) : [];
    await upsertFTSEntity('filters', filter._id, {
      _id: filter._id,
      key: filter.key || '',
      options: options.join(' '),
    });
  }

  // Seed events FTS
  const events = await drizzleDb.all(sql`SELECT _id, type FROM events`);
  for (const event of events) {
    await upsertFTSEntity('events', event._id, {
      _id: event._id,
      type: event.type || '',
    });
  }

  // Seed work_queue FTS
  const workQueue = await drizzleDb.all(
    sql`SELECT _id, originalWorkId, type, worker, input FROM work_queue`,
  );
  for (const work of workQueue) {
    await upsertFTSEntity('work_queue', work._id, {
      _id: work._id,
      originalWorkId: work.originalWorkId || '',
      type: work.type || '',
      worker: work.worker || '',
      input: typeof work.input === 'string' ? work.input : JSON.stringify(work.input || {}),
    });
  }

  // Seed token_surrogates FTS
  const tokenSurrogates = await drizzleDb.all(
    sql`SELECT _id, tokenSerialNumber, userId, productId, contractAddress, walletAddress FROM token_surrogates`,
  );
  for (const token of tokenSurrogates) {
    await upsertFTSEntity('token_surrogates', token._id, {
      _id: token._id,
      tokenSerialNumber: token.tokenSerialNumber || '',
      userId: token.userId || '',
      productId: token.productId || '',
      contractAddress: token.contractAddress || '',
      walletAddress: token.walletAddress || '',
    });
  }
}

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

  // Seed FTS data after all entities are seeded
  await seedFTSData(drizzleDb);
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
    // Rebuild search indexes after seeding
    await rebuildSearchIndexes(testContext.unchainedAPI.modules);
    return testContext;
  }

  // Initialize platform (creates server and database)
  const { db, port, unchainedAPI } = await initializeTestPlatform();

  // Seed database
  await seedDatabaseTables(db);

  // Rebuild search indexes after seeding
  await rebuildSearchIndexes(unchainedAPI.modules);

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
    unchainedAPI,
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

/**
 * Refresh FTS index after test-specific data has been seeded.
 * Call this after inserting additional entities in test.before hooks.
 */
export const refreshFTSIndex = async () => {
  if (!testContext) {
    throw new Error('Test context not initialized. Call setupDatabase first.');
  }
  await seedFTSData(testContext.db);
};
