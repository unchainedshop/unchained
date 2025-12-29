import { Collection } from 'mongodb';
import {
  initializeTestPlatform,
  shutdownTestPlatform,
  getTestPlatform,
  getServerPort,
  getDrizzleDb,
} from './setup.js';
import seedLocaleData, { seedCountriesToDrizzle, seedLanguagesToDrizzle, seedCurrenciesToDrizzle } from './seeds/locale-data.js';
import seedUsers, { ADMIN_TOKEN } from './seeds/users.js';
import seedProducts from './seeds/products.js';
import seedDeliveries from './seeds/deliveries.js';
import seedPayments from './seeds/payments.js';
import seedWarehousings from './seeds/warehousings.js';
import seedOrders from './seeds/orders.js';
import seedQuotations from './seeds/quotations.js';
import seedFilters from './seeds/filters.js';
import seedAssortments from './seeds/assortments.js';
import seedBookmarks, { seedBookmarksToDrizzle } from './seeds/bookmark.js';
import seedEnrollment from './seeds/enrollments.js';
import seedWorkQueue from './seeds/work.js';
import seedEvents from './seeds/events.js';
import seedTokens from './seeds/tokens.js';
import { GraphQLClient } from 'graphql-request';
// Drizzle imports for table helpers
import { countries } from '@unchainedshop/core-countries';
import { currencies } from '@unchainedshop/core-currencies';
import { languages } from '@unchainedshop/core-languages';
import { bookmarks } from '@unchainedshop/core-bookmarks';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';

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
  await seedTokens(db);

  // Seed data directly into the Drizzle database (bypasses module to avoid emitting events)
  await seedCountriesToDrizzle(drizzleDb);
  await seedLanguagesToDrizzle(drizzleDb);
  await seedCurrenciesToDrizzle(drizzleDb);
  await seedBookmarksToDrizzle(drizzleDb);

  // Seed events AFTER countries to avoid COUNTRY_CREATE events polluting the test data
  // Clear events collection first to remove any events emitted during seeding
  await db.collection('events').deleteMany({});
  await seedEvents(db);

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

/**
 * Get a wrapper for the countries table with MongoDB-like API for tests.
 * This allows tests to directly manipulate the countries table.
 */
export function getCountriesTable() {
  const drizzleDb = getDrizzleDb();

  return {
    async findOne(filter = {}) {
      let query = drizzleDb.select().from(countries);
      if (filter._id) {
        query = query.where(eq(countries._id, filter._id));
      } else if (filter.isoCode) {
        query = query.where(eq(countries.isoCode, filter.isoCode));
      }
      const results = await query.limit(1);
      return results[0] || null;
    },
    async insertOne(doc) {
      await drizzleDb.insert(countries).values({
        _id: doc._id,
        isoCode: doc.isoCode,
        isActive: doc.isActive ?? true,
        defaultCurrencyCode: doc.defaultCurrencyCode,
        created: doc.created || new Date(),
        deleted: doc.deleted,
      });
      // Also insert into FTS
      await drizzleDb.run(
        sql`INSERT OR REPLACE INTO countries_fts (_id, isoCode, defaultCurrencyCode) VALUES (${doc._id}, ${doc.isoCode}, ${doc.defaultCurrencyCode || ''})`,
      );
      return { insertedId: doc._id };
    },
    async deleteOne(filter) {
      if (filter._id) {
        await drizzleDb.delete(countries).where(eq(countries._id, filter._id));
        await drizzleDb.run(sql`DELETE FROM countries_fts WHERE _id = ${filter._id}`);
      } else if (filter.isoCode) {
        const country = await this.findOne(filter);
        if (country) {
          await drizzleDb.delete(countries).where(eq(countries.isoCode, filter.isoCode));
          await drizzleDb.run(sql`DELETE FROM countries_fts WHERE _id = ${country._id}`);
        }
      }
      return { deletedCount: 1 };
    },
    async countDocuments(filter = {}) {
      let query = drizzleDb.select({ count: sql`count(*)` }).from(countries);
      const conditions = [];
      if (filter._id) {
        conditions.push(eq(countries._id, filter._id));
      }
      if (filter.deleted === null) {
        conditions.push(isNull(countries.deleted));
      } else if (filter.deleted !== undefined) {
        conditions.push(isNotNull(countries.deleted));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      const result = await query;
      return result[0]?.count ?? 0;
    },
  };
}

/**
 * Get a wrapper for the currencies table with MongoDB-like API for tests.
 * This allows tests to directly manipulate the currencies table.
 */
export function getCurrenciesTable() {
  const drizzleDb = getDrizzleDb();

  return {
    async findOne(filter = {}) {
      let query = drizzleDb.select().from(currencies);
      if (filter._id) {
        query = query.where(eq(currencies._id, filter._id));
      } else if (filter.isoCode) {
        query = query.where(eq(currencies.isoCode, filter.isoCode));
      }
      const results = await query.limit(1);
      return results[0] || null;
    },
    async insertOne(doc) {
      await drizzleDb.insert(currencies).values({
        _id: doc._id,
        isoCode: doc.isoCode,
        isActive: doc.isActive ?? true,
        contractAddress: doc.contractAddress,
        decimals: doc.decimals,
        created: doc.created || new Date(),
        deleted: doc.deleted,
      });
      // Also insert into FTS
      await drizzleDb.run(
        sql`INSERT OR REPLACE INTO currencies_fts (_id, isoCode) VALUES (${doc._id}, ${doc.isoCode})`,
      );
      return { insertedId: doc._id };
    },
    async deleteOne(filter) {
      if (filter._id) {
        await drizzleDb.delete(currencies).where(eq(currencies._id, filter._id));
        await drizzleDb.run(sql`DELETE FROM currencies_fts WHERE _id = ${filter._id}`);
      } else if (filter.isoCode) {
        const currency = await this.findOne(filter);
        if (currency) {
          await drizzleDb.delete(currencies).where(eq(currencies.isoCode, filter.isoCode));
          await drizzleDb.run(sql`DELETE FROM currencies_fts WHERE _id = ${currency._id}`);
        }
      }
      return { deletedCount: 1 };
    },
    async countDocuments(filter = {}) {
      let query = drizzleDb.select({ count: sql`count(*)` }).from(currencies);
      const conditions = [];
      if (filter._id) {
        conditions.push(eq(currencies._id, filter._id));
      }
      if (filter.deleted === null) {
        conditions.push(isNull(currencies.deleted));
      } else if (filter.deleted !== undefined) {
        conditions.push(isNotNull(currencies.deleted));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      const result = await query;
      return result[0]?.count ?? 0;
    },
  };
}

/**
 * Get a wrapper for the languages table with MongoDB-like API for tests.
 * This allows tests to directly manipulate the languages table.
 */
export function getLanguagesTable() {
  const drizzleDb = getDrizzleDb();

  return {
    async findOne(filter = {}) {
      let query = drizzleDb.select().from(languages);
      if (filter._id) {
        query = query.where(eq(languages._id, filter._id));
      } else if (filter.isoCode) {
        query = query.where(eq(languages.isoCode, filter.isoCode));
      }
      const results = await query.limit(1);
      return results[0] || null;
    },
    async insertOne(doc) {
      await drizzleDb.insert(languages).values({
        _id: doc._id,
        isoCode: doc.isoCode,
        isActive: doc.isActive ?? true,
        created: doc.created || new Date(),
        deleted: doc.deleted,
      });
      // Also insert into FTS
      await drizzleDb.run(
        sql`INSERT OR REPLACE INTO languages_fts (_id, isoCode) VALUES (${doc._id}, ${doc.isoCode})`,
      );
      return { insertedId: doc._id };
    },
    async deleteOne(filter) {
      if (filter._id) {
        await drizzleDb.delete(languages).where(eq(languages._id, filter._id));
        await drizzleDb.run(sql`DELETE FROM languages_fts WHERE _id = ${filter._id}`);
      } else if (filter.isoCode) {
        const language = await this.findOne(filter);
        if (language) {
          await drizzleDb.delete(languages).where(eq(languages.isoCode, filter.isoCode));
          await drizzleDb.run(sql`DELETE FROM languages_fts WHERE _id = ${language._id}`);
        }
      }
      return { deletedCount: 1 };
    },
    async countDocuments(filter = {}) {
      let query = drizzleDb.select({ count: sql`count(*)` }).from(languages);
      const conditions = [];
      if (filter._id) {
        conditions.push(eq(languages._id, filter._id));
      }
      if (filter.deleted === null) {
        conditions.push(isNull(languages.deleted));
      } else if (filter.deleted !== undefined) {
        conditions.push(isNotNull(languages.deleted));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      const result = await query;
      return result[0]?.count ?? 0;
    },
  };
}

/**
 * Get a wrapper for the bookmarks table with MongoDB-like API for tests.
 * This allows tests to directly manipulate the bookmarks table.
 */
export function getBookmarksTable() {
  const drizzleDb = getDrizzleDb();

  return {
    async findOne(filter = {}) {
      let query = drizzleDb.select().from(bookmarks);
      if (filter._id) {
        query = query.where(eq(bookmarks._id, filter._id));
      } else if (filter.userId && filter.productId) {
        query = query.where(and(eq(bookmarks.userId, filter.userId), eq(bookmarks.productId, filter.productId)));
      }
      const results = await query.limit(1);
      return results[0] || null;
    },
    async insertOne(doc) {
      await drizzleDb.insert(bookmarks).values({
        _id: doc._id,
        userId: doc.userId,
        productId: doc.productId,
        meta: doc.meta ? JSON.stringify(doc.meta) : null,
        created: doc.created ? new Date(doc.created) : new Date(),
      });
      return { insertedId: doc._id };
    },
    async deleteOne(filter) {
      if (filter._id) {
        await drizzleDb.delete(bookmarks).where(eq(bookmarks._id, filter._id));
      }
      return { deletedCount: 1 };
    },
    async countDocuments(filter = {}) {
      let query = drizzleDb.select({ count: sql`count(*)` }).from(bookmarks);
      const conditions = [];
      if (filter._id) {
        conditions.push(eq(bookmarks._id, filter._id));
      }
      if (filter.userId) {
        conditions.push(eq(bookmarks.userId, filter.userId));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      const result = await query;
      return result[0]?.count ?? 0;
    },
  };
}

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
