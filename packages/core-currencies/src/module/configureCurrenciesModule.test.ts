/**
 * Tests for the Currencies Module with Drizzle ORM
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createTestDb, type DrizzleDbConnection } from '@unchainedshop/store';
import { initializeCurrenciesSchema } from '../db/index.ts';
import { configureCurrenciesModule, type CurrenciesModule } from './configureCurrenciesModule.ts';

describe('Currencies Module', () => {
  let connection: DrizzleDbConnection;
  let currenciesModule: CurrenciesModule;

  before(async () => {
    // Create in-memory SQLite database for testing
    connection = createTestDb();
    await initializeCurrenciesSchema(connection.db);

    currenciesModule = await configureCurrenciesModule({ db: connection.db });

    // Seed test data
    await currenciesModule.create({ isoCode: 'CHF' });
    await currenciesModule.create({ isoCode: 'EUR' });
    await currenciesModule.create({ isoCode: 'USD' });
    await currenciesModule.create({ isoCode: 'GBP' });
    await currenciesModule.create({
      isoCode: 'ETH',
      contractAddress: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    });
  });

  after(async () => {
    connection.close();
  });

  describe('CRUD operations', () => {
    it('should create a currency', async () => {
      const currencyId = await currenciesModule.create({
        isoCode: 'JPY',
      });

      assert.ok(currencyId, 'Should return a currency ID');
      assert.strictEqual(typeof currencyId, 'string');
    });

    it('should find a currency by ID', async () => {
      const currencyId = await currenciesModule.create({
        isoCode: 'CAD',
      });

      const currency = await currenciesModule.findCurrency({ currencyId });

      assert.ok(currency, 'Should find the currency');
      assert.strictEqual(currency.isoCode, 'CAD');
      assert.strictEqual(currency.isActive, true);
    });

    it('should find a currency by ISO code', async () => {
      const currency = await currenciesModule.findCurrency({ isoCode: 'CHF' });

      assert.ok(currency, 'Should find the currency');
      assert.strictEqual(currency.isoCode, 'CHF');
    });

    it('should update a currency', async () => {
      const currency = await currenciesModule.findCurrency({ isoCode: 'EUR' });
      assert.ok(currency);

      await currenciesModule.update(currency._id, {
        isActive: false,
      });

      const updated = await currenciesModule.findCurrency({ currencyId: currency._id });
      assert.ok(updated);
      assert.strictEqual(updated.isActive, false);
      assert.ok(updated.updated, 'Should have updated timestamp');
    });

    it('should soft-delete a currency', async () => {
      const currencyId = await currenciesModule.create({
        isoCode: 'AUD',
      });

      const deleteCount = await currenciesModule.delete(currencyId);
      assert.strictEqual(deleteCount, 1);

      // Should not find deleted currency by default
      const currencies = await currenciesModule.findCurrencies({});
      const audCurrency = currencies.find((c) => c.isoCode === 'AUD');
      assert.ok(!audCurrency, 'Deleted currency should not be in results');
    });
  });

  describe('Query operations', () => {
    it('should find currencies with pagination', async () => {
      const firstPage = await currenciesModule.findCurrencies({ limit: 2, offset: 0 });
      assert.strictEqual(firstPage.length, 2, 'First page should have 2 currencies');

      const secondPage = await currenciesModule.findCurrencies({ limit: 2, offset: 2 });
      assert.ok(secondPage.length >= 1, 'Second page should have at least 1 currency');
    });

    it('should filter by ISO codes', async () => {
      const currencies = await currenciesModule.findCurrencies({
        isoCodes: ['CHF', 'EUR'],
        includeInactive: true,
      });

      assert.ok(currencies.length >= 1, 'Should find at least one currency');
      for (const currency of currencies) {
        assert.ok(
          ['CHF', 'EUR'].includes(currency.isoCode),
          `ISO code ${currency.isoCode} should be CHF or EUR`,
        );
      }
    });

    it('should filter by contract address', async () => {
      const currencies = await currenciesModule.findCurrencies({
        contractAddress: '0x0000000000000000000000000000000000000000',
      });

      assert.ok(currencies.length >= 1, 'Should find at least one currency');
      assert.strictEqual(currencies[0].isoCode, 'ETH');
    });

    it('should count currencies', async () => {
      const count = await currenciesModule.count({});
      assert.ok(count >= 4, `Expected at least 4 currencies, got ${count}`);
    });

    it('should check currency exists', async () => {
      const currency = await currenciesModule.findCurrency({ isoCode: 'CHF' });
      assert.ok(currency, 'Should find CHF currency');

      const exists = await currenciesModule.currencyExists({ currencyId: currency._id });
      assert.strictEqual(exists, true, 'Currency should exist');

      const notExists = await currenciesModule.currencyExists({ currencyId: 'nonexistent' });
      assert.strictEqual(notExists, false, 'Non-existent currency should not exist');
    });
  });

  describe('Full-text search', () => {
    it('should search currencies by text', async () => {
      const currencies = await currenciesModule.findCurrencies({
        queryString: 'CHF',
      });

      assert.ok(currencies.length >= 1, 'Should find at least one currency');
      const chfCurrency = currencies.find((c) => c.isoCode === 'CHF');
      assert.ok(chfCurrency, 'Should find CHF currency via FTS');
    });

    it('should return empty array for no FTS matches', async () => {
      const currencies = await currenciesModule.findCurrencies({
        queryString: 'ZZZZNONEXISTENT',
      });

      assert.strictEqual(currencies.length, 0, 'Should return empty array for no matches');
    });
  });

  describe('Field projection', () => {
    it('should return only specified fields', async () => {
      const currencies = await currenciesModule.findCurrencies({}, { fields: ['isoCode', 'isActive'] });

      assert.ok(currencies.length >= 1, 'Should find at least one currency');
      const currency = currencies[0];

      // Should have the requested fields
      assert.ok('isoCode' in currency, 'Should have isoCode');
      assert.ok('isActive' in currency, 'Should have isActive');

      // Should NOT have other fields
      assert.ok(!('created' in currency), 'Should not have created');
      assert.ok(!('updated' in currency), 'Should not have updated');
    });

    it('should return all fields when no projection specified', async () => {
      const currencies = await currenciesModule.findCurrencies({});

      assert.ok(currencies.length >= 1, 'Should find at least one currency');
      const currency = currencies[0];

      // Should have all fields
      assert.ok('_id' in currency, 'Should have _id');
      assert.ok('isoCode' in currency, 'Should have isoCode');
      assert.ok('created' in currency, 'Should have created');
      assert.ok('isActive' in currency, 'Should have isActive');
    });
  });

  describe('Sorting', () => {
    it('should sort currencies by isoCode ascending', async () => {
      const currencies = await currenciesModule.findCurrencies({
        sort: [{ key: 'isoCode', value: 'ASC' }],
        includeInactive: true,
      });

      assert.ok(currencies.length >= 2, 'Should have at least 2 currencies');

      // Check that currencies are sorted ascending by isoCode
      for (let i = 1; i < currencies.length; i++) {
        assert.ok(
          currencies[i].isoCode >= currencies[i - 1].isoCode,
          `${currencies[i].isoCode} should be >= ${currencies[i - 1].isoCode}`,
        );
      }
    });

    it('should sort currencies by isoCode descending', async () => {
      const currencies = await currenciesModule.findCurrencies({
        sort: [{ key: 'isoCode', value: 'DESC' }],
        includeInactive: true,
      });

      assert.ok(currencies.length >= 2, 'Should have at least 2 currencies');

      // Check that currencies are sorted descending by isoCode
      for (let i = 1; i < currencies.length; i++) {
        assert.ok(
          currencies[i].isoCode <= currencies[i - 1].isoCode,
          `${currencies[i].isoCode} should be <= ${currencies[i - 1].isoCode}`,
        );
      }
    });
  });
});
