/**
 * Tests for the TinyBase adapter.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createTinyBaseStore } from './tinybase.ts';
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

describe('TinyBase Adapter', () => {
  let store: IStore;

  before(async () => {
    // Create a store without IndexedDB persistence (Node.js environment)
    store = await createTinyBaseStore({
      environment: 'browser',
      persist: false, // Disable IndexedDB persistence for Node.js tests
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

  describe('Reactive subscriptions', () => {
    it('should support subscribe for table changes', async () => {
      const Countries = store.table<TestCountry>('countries');

      let receivedData: TestCountry[] = [];
      let callCount = 0;

      const unsubscribe = Countries.subscribe!({}, (countries) => {
        receivedData = countries;
        callCount++;
      });

      // Wait for initial callback
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.ok(callCount >= 1, 'Should receive initial callback');
      assert.ok(receivedData.length > 0, 'Should receive initial data');

      // Insert a new country
      await Countries.insertOne({
        isoCode: 'NZ',
        isActive: true,
        defaultCurrencyCode: 'NZD',
        created: new Date(),
        deleted: null,
      });

      // Wait for change callback
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.ok(callCount >= 2, 'Should receive callback after insert');
      assert.ok(
        receivedData.some((c) => c.isoCode === 'NZ'),
        'Should include new country',
      );

      unsubscribe();
    });

    it('should support subscribeOne for single document changes', async () => {
      const Countries = store.table<TestCountry>('countries');

      // Create a country to watch
      const result = await Countries.insertOne({
        isoCode: 'CA',
        isActive: true,
        defaultCurrencyCode: 'CAD',
        created: new Date(),
        deleted: null,
      });

      let receivedData: TestCountry | null = null;
      let callCount = 0;

      const unsubscribe = Countries.subscribeOne!({ _id: result.insertedId }, (country) => {
        receivedData = country;
        callCount++;
      });

      // Wait for initial callback
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.ok(callCount >= 1, 'Should receive initial callback');
      assert.ok(receivedData, 'Should receive initial data');
      assert.strictEqual(receivedData?.isoCode, 'CA');

      // Update the country
      await Countries.updateOne({ _id: result.insertedId }, { $set: { defaultCurrencyCode: 'USD' } });

      // Wait for change callback
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.ok(callCount >= 2, 'Should receive callback after update');
      assert.strictEqual(receivedData?.defaultCurrencyCode, 'USD');

      unsubscribe();
    });
  });

  describe('Integration with core-countries pattern', () => {
    it('should work with the countries module pattern', async () => {
      const Countries = store.table<TestCountry>('countries');

      // Simulate the pattern from configureCountriesModule
      const countryId = 'test-country-id-tinybase';
      await Countries.insertOne({
        _id: countryId,
        isoCode: 'MX',
        isActive: true,
        defaultCurrencyCode: 'MXN',
        created: new Date(),
        deleted: null,
      });

      // Find by ID (like findCountry)
      const byId = await Countries.findOne({ _id: countryId });
      assert.ok(byId);
      assert.strictEqual(byId.isoCode, 'MX');

      // Find by ISO code
      const byCode = await Countries.findOne({ isoCode: 'MX' });
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
