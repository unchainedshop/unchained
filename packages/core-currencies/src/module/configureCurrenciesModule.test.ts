/**
 * Tests for the Currencies Module
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createMemoryStore } from '@unchainedshop/store/memory';
import { configureCurrenciesModule, type CurrenciesModule } from './configureCurrenciesModule.ts';

describe('Currencies Module', () => {
  let store: Awaited<ReturnType<typeof createMemoryStore>>;
  let currenciesModule: CurrenciesModule;

  before(async () => {
    store = await createMemoryStore({ environment: 'server' });
    currenciesModule = await configureCurrenciesModule({ store });

    // Seed test data
    await currenciesModule.create({ isoCode: 'CHF', isActive: true });
    await currenciesModule.create({ isoCode: 'EUR', isActive: true });
    await currenciesModule.create({ isoCode: 'GBP', isActive: true });
    await currenciesModule.create({ isoCode: 'JPY', isActive: true, decimals: 0 });
    await currenciesModule.create({
      isoCode: 'ETH',
      isActive: true,
      contractAddress: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    });
  });

  after(async () => {
    await store.close();
  });

  describe('CRUD operations', () => {
    it('should create a currency', async () => {
      const currencyId = await currenciesModule.create({
        isoCode: 'USD',
        isActive: true,
      });

      assert.ok(currencyId, 'Should return a currency ID');
      assert.strictEqual(typeof currencyId, 'string');
    });

    it('should find a currency by ID', async () => {
      const currencyId = await currenciesModule.create({
        isoCode: 'CAD',
        isActive: true,
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

    it('should uppercase ISO code on create', async () => {
      const currencyId = await currenciesModule.create({
        isoCode: 'aud',
        isActive: true,
      });

      const currency = await currenciesModule.findCurrency({ currencyId });
      assert.ok(currency);
      assert.strictEqual(currency.isoCode, 'AUD', 'ISO code should be uppercased');
    });

    it('should update a currency', async () => {
      const currency = await currenciesModule.findCurrency({ isoCode: 'EUR' });
      assert.ok(currency);

      await currenciesModule.update(currency._id, {
        decimals: 2,
      });

      const updated = await currenciesModule.findCurrency({ currencyId: currency._id });
      assert.ok(updated);
      assert.strictEqual(updated.decimals, 2);
      assert.ok(updated.updated, 'Should have updated timestamp');
    });

    it('should soft-delete a currency', async () => {
      const currencyId = await currenciesModule.create({
        isoCode: 'SEK',
        isActive: true,
      });

      const deleteCount = await currenciesModule.delete(currencyId);
      assert.strictEqual(deleteCount, 1);

      // Should not find deleted currency by default
      const currencies = await currenciesModule.findCurrencies({});
      const sekCurrency = currencies.find((c) => c.isoCode === 'SEK');
      assert.ok(!sekCurrency, 'Deleted currency should not be in results');
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
      assert.ok(count >= 5, `Expected at least 5 currencies, got ${count}`);
    });

    it('should check currency exists', async () => {
      const currency = await currenciesModule.findCurrency({ isoCode: 'CHF' });
      assert.ok(currency, 'Should find CHF currency');

      const exists = await currenciesModule.currencyExists({ currencyId: currency._id });
      assert.strictEqual(exists, true, 'Currency should exist');

      const notExists = await currenciesModule.currencyExists({ currencyId: 'nonexistent' });
      assert.strictEqual(notExists, false, 'Non-existent currency should not exist');
    });

    it('should filter inactive currencies by default', async () => {
      const currencyId = await currenciesModule.create({
        isoCode: 'NOK',
        isActive: false,
      });

      // Should not appear in default query
      const currencies = await currenciesModule.findCurrencies({});
      const nokCurrency = currencies.find((c) => c.isoCode === 'NOK');
      assert.ok(!nokCurrency, 'Inactive currency should not appear by default');

      // Should appear when includeInactive is true
      const allCurrencies = await currenciesModule.findCurrencies({ includeInactive: true });
      const nokWithInactive = allCurrencies.find((c) => c.isoCode === 'NOK');
      assert.ok(nokWithInactive, 'Inactive currency should appear with includeInactive');

      // Clean up
      await currenciesModule.delete(currencyId);
    });
  });

  describe('Crypto currency features', () => {
    it('should store contract address and decimals', async () => {
      const currency = await currenciesModule.findCurrency({ isoCode: 'ETH' });

      assert.ok(currency, 'Should find ETH currency');
      assert.strictEqual(currency.contractAddress, '0x0000000000000000000000000000000000000000');
      assert.strictEqual(currency.decimals, 18);
    });

    it('should store zero decimals for currencies like JPY', async () => {
      const currency = await currenciesModule.findCurrency({ isoCode: 'JPY' });

      assert.ok(currency, 'Should find JPY currency');
      assert.strictEqual(currency.decimals, 0);
    });
  });
});
