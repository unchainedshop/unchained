/**
 * Tests for the Memory adapter.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createMemoryStore } from './memory.ts';
import type { IStore } from '../types.ts';

interface TestCountry {
  _id: string;
  isoCode: string;
  isActive: boolean;
  defaultCurrencyCode?: string;
  population?: number;
  tags?: string[];
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

describe('Memory Adapter', () => {
  let store: IStore;

  before(async () => {
    store = await createMemoryStore({ environment: 'server' });
    await store.initialize();
  });

  after(async () => {
    await store.close();
  });

  describe('CRUD operations', () => {
    it('should insert and find a document', async () => {
      const Countries = store.table<TestCountry>('countries_crud');

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

    it('should use provided _id if given', async () => {
      const Countries = store.table<TestCountry>('countries_crud');

      const customId = 'custom-id-123';
      const result = await Countries.insertOne({
        _id: customId,
        isoCode: 'AT',
        isActive: true,
        created: new Date(),
        deleted: null,
      });

      assert.strictEqual(result.insertedId, customId);

      const country = await Countries.findOne({ _id: customId });
      assert.ok(country);
      assert.strictEqual(country._id, customId);
    });

    it('should find by custom field', async () => {
      const Countries = store.table<TestCountry>('countries_crud');

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

    it('should update a document with $set', async () => {
      const Countries = store.table<TestCountry>('countries_crud');

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
      assert.strictEqual(updateResult.matchedCount, 1);

      const updated = await Countries.findOne({ _id: insertResult.insertedId });
      assert.ok(updated, 'Should find updated country');
      assert.strictEqual(updated.defaultCurrencyCode, 'USD');
    });

    it('should return zero counts when updating non-existent document', async () => {
      const Countries = store.table<TestCountry>('countries_crud');

      const updateResult = await Countries.updateOne(
        { _id: 'non-existent-id' },
        { $set: { isActive: false } },
      );

      assert.strictEqual(updateResult.modifiedCount, 0);
      assert.strictEqual(updateResult.matchedCount, 0);
    });

    it('should delete a document', async () => {
      const Countries = store.table<TestCountry>('countries_crud');

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

    it('should return zero when deleting non-existent document', async () => {
      const Countries = store.table<TestCountry>('countries_crud');

      const deleteResult = await Countries.deleteOne({ _id: 'non-existent-id' });
      assert.strictEqual(deleteResult.deletedCount, 0);
    });

    it('should insert many documents', async () => {
      const Countries = store.table<TestCountry>('countries_insert_many');

      const result = await Countries.insertMany([
        { isoCode: 'US', isActive: true, created: new Date(), deleted: null },
        { isoCode: 'CA', isActive: true, created: new Date(), deleted: null },
        { isoCode: 'MX', isActive: true, created: new Date(), deleted: null },
      ]);

      assert.strictEqual(result.insertedCount, 3);
      assert.strictEqual(result.insertedIds.length, 3);

      const count = await Countries.countDocuments({});
      assert.strictEqual(count, 3);
    });
  });

  describe('Query operations', () => {
    let Countries: ReturnType<typeof store.table<TestCountry>>;

    before(async () => {
      Countries = store.table<TestCountry>('countries_query');

      await Countries.insertMany([
        {
          isoCode: 'US',
          isActive: true,
          defaultCurrencyCode: 'USD',
          population: 330000000,
          created: new Date('2020-01-01'),
          deleted: null,
        },
        {
          isoCode: 'GB',
          isActive: true,
          defaultCurrencyCode: 'GBP',
          population: 67000000,
          created: new Date('2020-02-01'),
          deleted: null,
        },
        {
          isoCode: 'JP',
          isActive: true,
          defaultCurrencyCode: 'JPY',
          population: 126000000,
          created: new Date('2020-03-01'),
          deleted: null,
        },
        {
          isoCode: 'AU',
          isActive: false,
          defaultCurrencyCode: 'AUD',
          population: 26000000,
          created: new Date('2020-04-01'),
          deleted: null,
        },
        {
          isoCode: 'NZ',
          isActive: false,
          defaultCurrencyCode: 'NZD',
          population: 5000000,
          created: new Date('2020-05-01'),
          deleted: new Date(),
        },
      ]);
    });

    it('should find with $in operator', async () => {
      const countries = await Countries.find({
        isoCode: { $in: ['US', 'GB', 'JP'] },
      });

      assert.strictEqual(countries.length, 3, 'Should find 3 countries');
      const isoCodes = countries.map((c) => c.isoCode);
      assert.ok(isoCodes.includes('US'));
      assert.ok(isoCodes.includes('GB'));
      assert.ok(isoCodes.includes('JP'));
    });

    it('should find with $nin operator', async () => {
      const countries = await Countries.find({
        isoCode: { $nin: ['US', 'GB'] },
      });

      assert.strictEqual(countries.length, 3);
      const isoCodes = countries.map((c) => c.isoCode);
      assert.ok(!isoCodes.includes('US'));
      assert.ok(!isoCodes.includes('GB'));
    });

    it('should find with $eq operator', async () => {
      const countries = await Countries.find({
        isoCode: { $eq: 'US' },
      });

      assert.strictEqual(countries.length, 1);
      assert.strictEqual(countries[0].isoCode, 'US');
    });

    it('should find with $ne operator', async () => {
      const countries = await Countries.find({
        isoCode: { $ne: 'US' },
      });

      assert.strictEqual(countries.length, 4);
      assert.ok(!countries.some((c) => c.isoCode === 'US'));
    });

    it('should find with $gt operator', async () => {
      const countries = await Countries.find({
        population: { $gt: 100000000 },
      });

      assert.strictEqual(countries.length, 2);
      const isoCodes = countries.map((c) => c.isoCode);
      assert.ok(isoCodes.includes('US'));
      assert.ok(isoCodes.includes('JP'));
    });

    it('should find with $gte operator', async () => {
      const countries = await Countries.find({
        population: { $gte: 126000000 },
      });

      assert.strictEqual(countries.length, 2);
    });

    it('should find with $lt operator', async () => {
      const countries = await Countries.find({
        population: { $lt: 30000000 },
      });

      assert.strictEqual(countries.length, 2);
      const isoCodes = countries.map((c) => c.isoCode);
      assert.ok(isoCodes.includes('AU'));
      assert.ok(isoCodes.includes('NZ'));
    });

    it('should find with $lte operator', async () => {
      const countries = await Countries.find({
        population: { $lte: 26000000 },
      });

      assert.strictEqual(countries.length, 2);
    });

    it('should find with $exists operator', async () => {
      const withPopulation = await Countries.find({
        population: { $exists: true },
      });
      assert.strictEqual(withPopulation.length, 5);

      // Insert one without population
      await Countries.insertOne({
        isoCode: 'XX',
        isActive: true,
        created: new Date(),
        deleted: null,
      });

      const all = await Countries.countDocuments({});
      assert.strictEqual(all, 6);
    });

    it('should find with $regex operator', async () => {
      const countries = await Countries.find({
        isoCode: { $regex: '^U' },
      });

      assert.strictEqual(countries.length, 1);
      assert.strictEqual(countries[0].isoCode, 'US');
    });

    it('should find with $and operator', async () => {
      const countries = await Countries.find({
        $and: [{ isActive: true }, { population: { $gt: 100000000 } }],
      });

      assert.strictEqual(countries.length, 2);
    });

    it('should find with $or operator', async () => {
      const countries = await Countries.find({
        $or: [{ isoCode: 'US' }, { isoCode: 'GB' }],
      });

      assert.strictEqual(countries.length, 2);
    });

    it('should find with $text search (simple substring)', async () => {
      const countries = await Countries.find({
        $text: { $search: 'USD' },
      });

      assert.strictEqual(countries.length, 1);
      assert.strictEqual(countries[0].isoCode, 'US');
    });

    it('should find with equality filter', async () => {
      const countries = await Countries.find({ isActive: false });
      assert.strictEqual(countries.length, 2, 'Should find 2 inactive countries');
    });

    it('should count documents', async () => {
      const totalCount = await Countries.countDocuments({});
      assert.ok(totalCount >= 5, `Should have at least 5 countries, got ${totalCount}`);

      const activeCount = await Countries.countDocuments({ isActive: true });
      assert.ok(activeCount >= 3, `Should have at least 3 active countries, got ${activeCount}`);
    });

    it('should count documents with empty filter', async () => {
      const count = await Countries.countDocuments();
      assert.ok(count >= 5);
    });

    it('should find with limit and offset', async () => {
      const firstTwo = await Countries.find({ isActive: true }, { limit: 2 });
      assert.strictEqual(firstTwo.length, 2, 'Should return 2 countries');

      const nextTwo = await Countries.find({ isActive: true }, { limit: 2, offset: 2 });
      assert.ok(nextTwo.length >= 1, 'Should return at least 1 country');
    });

    it('should sort documents ASC', async () => {
      const countries = await Countries.find(
        { isActive: true, population: { $exists: true } },
        { sort: [{ key: 'population', value: 'ASC' }] },
      );

      for (let i = 1; i < countries.length; i++) {
        const prev = countries[i - 1].population || 0;
        const curr = countries[i].population || 0;
        assert.ok(prev <= curr, 'Should be sorted ascending by population');
      }
    });

    it('should sort documents DESC', async () => {
      const countries = await Countries.find(
        { isActive: true, population: { $exists: true } },
        { sort: [{ key: 'population', value: 'DESC' }] },
      );

      for (let i = 1; i < countries.length; i++) {
        const prev = countries[i - 1].population || 0;
        const curr = countries[i].population || 0;
        assert.ok(prev >= curr, 'Should be sorted descending by population');
      }
    });

    it('should handle null filter for deleted', async () => {
      const notDeleted = await Countries.find({ deleted: null });
      assert.ok(notDeleted.length >= 4, 'Should find non-deleted countries');

      const deletedCountry = notDeleted.find((c) => c.isoCode === 'NZ');
      assert.strictEqual(deletedCountry, undefined, 'NZ should not be in non-deleted results');
    });
  });

  describe('Update operations', () => {
    let Countries: ReturnType<typeof store.table<TestCountry>>;

    beforeEach(async () => {
      Countries = store.table<TestCountry>('countries_update_' + Date.now());
      await Countries.insertOne({
        _id: 'test-country',
        isoCode: 'TS',
        isActive: true,
        population: 1000,
        tags: ['tag1'],
        created: new Date(),
        deleted: null,
      });
    });

    it('should apply $set operator', async () => {
      await Countries.updateOne({ _id: 'test-country' }, { $set: { isActive: false } });

      const country = await Countries.findOne({ _id: 'test-country' });
      assert.strictEqual(country?.isActive, false);
    });

    it('should apply $unset operator', async () => {
      await Countries.updateOne({ _id: 'test-country' }, { $unset: { population: true } });

      const country = await Countries.findOne({ _id: 'test-country' });
      assert.strictEqual(country?.population, undefined);
    });

    it('should apply $inc operator', async () => {
      await Countries.updateOne({ _id: 'test-country' }, { $inc: { population: 500 } });

      const country = await Countries.findOne({ _id: 'test-country' });
      assert.strictEqual(country?.population, 1500);
    });

    it('should apply $inc with negative value', async () => {
      await Countries.updateOne({ _id: 'test-country' }, { $inc: { population: -200 } });

      const country = await Countries.findOne({ _id: 'test-country' });
      assert.strictEqual(country?.population, 800);
    });

    it('should apply $push operator', async () => {
      await Countries.updateOne({ _id: 'test-country' }, { $push: { tags: 'tag2' } });

      const country = await Countries.findOne({ _id: 'test-country' });
      assert.deepStrictEqual(country?.tags, ['tag1', 'tag2']);
    });

    it('should apply $pull operator', async () => {
      await Countries.updateOne({ _id: 'test-country' }, { $pull: { tags: 'tag1' } });

      const country = await Countries.findOne({ _id: 'test-country' });
      assert.deepStrictEqual(country?.tags, []);
    });

    it('should updateMany matching documents', async () => {
      await Countries.insertMany([
        { isoCode: 'A1', isActive: true, created: new Date(), deleted: null },
        { isoCode: 'A2', isActive: true, created: new Date(), deleted: null },
        { isoCode: 'A3', isActive: false, created: new Date(), deleted: null },
      ]);

      const result = await Countries.updateMany({ isActive: true }, { $set: { isActive: false } });

      // At least 2 were active (A1, A2), plus test-country
      assert.ok(result.matchedCount >= 2);
      assert.strictEqual(result.modifiedCount, result.matchedCount);

      const activeCount = await Countries.countDocuments({ isActive: true });
      assert.strictEqual(activeCount, 0);
    });
  });

  describe('Delete operations', () => {
    it('should deleteMany matching documents', async () => {
      const Countries = store.table<TestCountry>('countries_delete');

      await Countries.insertMany([
        { isoCode: 'D1', isActive: true, created: new Date(), deleted: null },
        { isoCode: 'D2', isActive: true, created: new Date(), deleted: null },
        { isoCode: 'D3', isActive: false, created: new Date(), deleted: null },
      ]);

      const result = await Countries.deleteMany({ isActive: true });
      assert.strictEqual(result.deletedCount, 2);

      const remaining = await Countries.countDocuments({});
      assert.strictEqual(remaining, 1);
    });

    it('should return zero when deleteMany matches nothing', async () => {
      const Countries = store.table<TestCountry>('countries_delete_empty');

      const result = await Countries.deleteMany({ isoCode: 'NONEXISTENT' });
      assert.strictEqual(result.deletedCount, 0);
    });
  });

  describe('Other operations', () => {
    it('should get distinct values', async () => {
      const Countries = store.table<TestCountry>('countries_distinct');

      await Countries.insertMany([
        { isoCode: 'X1', isActive: true, defaultCurrencyCode: 'USD', created: new Date(), deleted: null },
        { isoCode: 'X2', isActive: true, defaultCurrencyCode: 'EUR', created: new Date(), deleted: null },
        { isoCode: 'X3', isActive: false, defaultCurrencyCode: 'USD', created: new Date(), deleted: null },
        { isoCode: 'X4', isActive: true, defaultCurrencyCode: 'GBP', created: new Date(), deleted: null },
      ]);

      const currencies = await Countries.distinct('defaultCurrencyCode');
      assert.strictEqual(currencies.length, 3);
      assert.ok(currencies.includes('USD'));
      assert.ok(currencies.includes('EUR'));
      assert.ok(currencies.includes('GBP'));
    });

    it('should get distinct values with filter', async () => {
      const Countries = store.table<TestCountry>('countries_distinct');

      const activeCurrencies = await Countries.distinct('defaultCurrencyCode', { isActive: true });
      assert.ok(activeCurrencies.length >= 2);
    });

    it('should handle store transaction (pass-through)', async () => {
      const result = await store.transaction(async (txStore) => {
        const Countries = txStore.table<TestCountry>('countries_tx');
        await Countries.insertOne({
          isoCode: 'TX',
          isActive: true,
          created: new Date(),
          deleted: null,
        });
        return 'done';
      });

      assert.strictEqual(result, 'done');

      const Countries = store.table<TestCountry>('countries_tx');
      const country = await Countries.findOne({ isoCode: 'TX' });
      assert.ok(country);
    });

    it('should return empty array from getChangesSince', async () => {
      const changes = await store.getChangesSince?.(0);
      assert.deepStrictEqual(changes, []);
    });

    it('should have getCurrentVersion that increments', async () => {
      const v1 = store.getCurrentVersion?.();
      const v2 = store.getCurrentVersion?.();
      assert.ok(typeof v1 === 'number');
      assert.ok(typeof v2 === 'number');
      assert.ok(v2! > v1!, 'Version should increment');
    });
  });

  describe('Integration with core-countries pattern', () => {
    it('should work with the countries module pattern (soft delete)', async () => {
      const Countries = store.table<TestCountry>('countries_integration');

      const countryId = 'integration-test-id';
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

      // But should find without the deleted filter
      const found = await Countries.findOne({ _id: countryId });
      assert.ok(found, 'Should still find soft-deleted country without filter');
      assert.ok(found.deleted, 'deleted field should be set');
    });

    it('should handle create with deletion of previously soft-deleted', async () => {
      const Countries = store.table<TestCountry>('countries_integration');

      // First, hard delete any existing with same isoCode
      await Countries.deleteOne({ isoCode: 'RE', deleted: { $ne: null } });

      // Create new country
      const result = await Countries.insertOne({
        isoCode: 'RE',
        isActive: true,
        created: new Date(),
        deleted: null,
      });

      const country = await Countries.findOne({ _id: result.insertedId });
      assert.ok(country);
      assert.strictEqual(country.isoCode, 'RE');
    });
  });
});
