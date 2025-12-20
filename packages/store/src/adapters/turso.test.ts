/**
 * Tests for the Turso adapter.
 * Uses a local SQLite file for testing.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createTursoStore, type TableSchema } from './turso.ts';
import type { IStore } from '../types.ts';

interface TestCountry {
  _id: string;
  isoCode: string;
  isActive: boolean;
  defaultCurrencyCode?: string;
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

// Schema for the countries table used in tests
const countriesTestSchema: TableSchema = {
  columns: [
    { name: '_id', type: 'TEXT', primaryKey: true },
    { name: 'isoCode', type: 'TEXT', notNull: true },
    { name: 'isActive', type: 'INTEGER' },
    { name: 'defaultCurrencyCode', type: 'TEXT' },
    { name: 'created', type: 'INTEGER', notNull: true },
    { name: 'updated', type: 'INTEGER' },
    { name: 'deleted', type: 'INTEGER' },
  ],
  indexes: [{ name: 'idx_test_countries_isoCode', columns: ['isoCode'] }],
  fts: {
    columns: ['isoCode', 'defaultCurrencyCode'],
    tokenizer: 'unicode61',
  },
};

describe('Turso Adapter', () => {
  let store: IStore;

  before(async () => {
    // Create a store using a local SQLite file
    store = await createTursoStore({
      environment: 'server',
      url: 'file::memory:', // Use in-memory SQLite for testing
      schemas: {
        countries: countriesTestSchema,
      },
    });
    await store.initialize();
  });

  after(async () => {
    await store.close();
  });

  describe('CRUD operations', () => {
    it('should insert and find a document', async () => {
      const Countries = store.table<TestCountry>('countries');

      const result = await Countries.insertOne({
        isoCode: 'CH',
        isActive: true,
        defaultCurrencyCode: 'CHF',
        created: new Date(),
        deleted: null,
      });

      assert.ok(result.insertedId, 'Should return an inserted ID');

      const country = await Countries.findOne({ _id: result.insertedId });
      assert.ok(country, 'Should find the inserted country');
      assert.strictEqual(country.isoCode, 'CH');
      assert.strictEqual(country.defaultCurrencyCode, 'CHF');
      assert.strictEqual(country.isActive, true);
    });

    it('should find by custom field', async () => {
      const Countries = store.table<TestCountry>('countries');

      await Countries.insertOne({
        isoCode: 'DE',
        isActive: true,
        defaultCurrencyCode: 'EUR',
        created: new Date(),
        deleted: null,
      });

      const country = await Countries.findOne({ isoCode: 'DE' });
      assert.ok(country, 'Should find country by isoCode');
      assert.strictEqual(country.isoCode, 'DE');
    });

    it('should update a document', async () => {
      const Countries = store.table<TestCountry>('countries');

      const insertResult = await Countries.insertOne({
        isoCode: 'FR',
        isActive: true,
        defaultCurrencyCode: 'EUR',
        created: new Date(),
        deleted: null,
      });

      const updateResult = await Countries.updateOne(
        { _id: insertResult.insertedId },
        { $set: { defaultCurrencyCode: 'USD', updated: new Date() } },
      );

      assert.strictEqual(updateResult.modifiedCount, 1);

      const updated = await Countries.findOne({ _id: insertResult.insertedId });
      assert.ok(updated, 'Should find updated country');
      assert.strictEqual(updated.defaultCurrencyCode, 'USD');
    });

    it('should delete a document', async () => {
      const Countries = store.table<TestCountry>('countries');

      const insertResult = await Countries.insertOne({
        isoCode: 'IT',
        isActive: true,
        defaultCurrencyCode: 'EUR',
        created: new Date(),
        deleted: null,
      });

      const deleteResult = await Countries.deleteOne({ _id: insertResult.insertedId });
      assert.strictEqual(deleteResult.deletedCount, 1);

      const deleted = await Countries.findOne({ _id: insertResult.insertedId });
      assert.strictEqual(deleted, null, 'Deleted document should not be found');
    });
  });

  describe('Query operations', () => {
    before(async () => {
      const Countries = store.table<TestCountry>('countries');

      // Insert test data
      await Countries.insertMany([
        {
          isoCode: 'US',
          isActive: true,
          defaultCurrencyCode: 'USD',
          created: new Date(),
          deleted: null,
        },
        {
          isoCode: 'GB',
          isActive: true,
          defaultCurrencyCode: 'GBP',
          created: new Date(),
          deleted: null,
        },
        {
          isoCode: 'JP',
          isActive: true,
          defaultCurrencyCode: 'JPY',
          created: new Date(),
          deleted: null,
        },
        {
          isoCode: 'AU',
          isActive: false,
          defaultCurrencyCode: 'AUD',
          created: new Date(),
          deleted: null,
        },
      ]);
    });

    it('should find with $in operator', async () => {
      const Countries = store.table<TestCountry>('countries');

      const countries = await Countries.find({
        isoCode: { $in: ['US', 'GB', 'JP'] },
      });

      assert.strictEqual(countries.length, 3, 'Should find 3 countries');
      const isoCodes = countries.map((c) => c.isoCode);
      assert.ok(isoCodes.includes('US'));
      assert.ok(isoCodes.includes('GB'));
      assert.ok(isoCodes.includes('JP'));
    });

    it('should find with equality filter', async () => {
      const Countries = store.table<TestCountry>('countries');

      const countries = await Countries.find({ isActive: false });
      assert.strictEqual(countries.length, 1, 'Should find 1 inactive country');
      assert.strictEqual(countries[0].isoCode, 'AU');
    });

    it('should count documents', async () => {
      const Countries = store.table<TestCountry>('countries');

      const totalCount = await Countries.countDocuments({});
      assert.ok(totalCount >= 4, `Should have at least 4 countries, got ${totalCount}`);

      const activeCount = await Countries.countDocuments({ isActive: true });
      assert.ok(activeCount >= 3, `Should have at least 3 active countries, got ${activeCount}`);
    });

    it('should find with limit and offset', async () => {
      const Countries = store.table<TestCountry>('countries');

      const firstTwo = await Countries.find({ isActive: true }, { limit: 2 });
      assert.strictEqual(firstTwo.length, 2, 'Should return 2 countries');

      const nextTwo = await Countries.find({ isActive: true }, { limit: 2, offset: 2 });
      assert.ok(nextTwo.length >= 1, 'Should return at least 1 country');
    });

    it('should handle null filter for deleted', async () => {
      const Countries = store.table<TestCountry>('countries');

      const notDeleted = await Countries.find({ deleted: null });
      assert.ok(notDeleted.length > 0, 'Should find non-deleted countries');
    });
  });

  describe('Integration with core-countries', () => {
    it('should work with the countries module pattern', async () => {
      const Countries = store.table<TestCountry>('countries');

      // Simulate the pattern from configureCountriesModule
      const countryId = 'test-country-id';
      await Countries.insertOne({
        _id: countryId,
        isoCode: 'NZ',
        isActive: true,
        defaultCurrencyCode: 'NZD',
        created: new Date(),
        deleted: null,
      });

      // Find by ID (like findCountry)
      const byId = await Countries.findOne({ _id: countryId });
      assert.ok(byId);
      assert.strictEqual(byId.isoCode, 'NZ');

      // Find by ISO code
      const byCode = await Countries.findOne({ isoCode: 'NZ' });
      assert.ok(byCode);
      assert.strictEqual(byCode._id, countryId);

      // Soft delete (like delete method)
      await Countries.updateOne({ _id: countryId }, { $set: { deleted: new Date() } });

      // Should not find with deleted: null filter
      const notFound = await Countries.findOne({ _id: countryId, deleted: null });
      assert.strictEqual(notFound, null, 'Soft-deleted country should not be found');
    });
  });
});
