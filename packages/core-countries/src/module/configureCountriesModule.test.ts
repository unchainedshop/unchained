/**
 * Tests for the Countries Module
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createMemoryStore } from '@unchainedshop/store/memory';
import { configureCountriesModule, type CountriesModule } from './configureCountriesModule.ts';

describe('Countries Module', () => {
  let store: Awaited<ReturnType<typeof createMemoryStore>>;
  let countriesModule: CountriesModule;

  before(async () => {
    store = await createMemoryStore({ environment: 'server' });
    countriesModule = await configureCountriesModule({ store });

    // Seed test data
    await countriesModule.create({ isoCode: 'CH', defaultCurrencyCode: 'CHF' });
    await countriesModule.create({ isoCode: 'DE', defaultCurrencyCode: 'EUR' });
    await countriesModule.create({ isoCode: 'FR', defaultCurrencyCode: 'EUR' });
    await countriesModule.create({ isoCode: 'IT', defaultCurrencyCode: 'EUR' });
    await countriesModule.create({ isoCode: 'ES', defaultCurrencyCode: 'EUR' });
  });

  after(async () => {
    await store.close();
  });

  describe('CRUD operations', () => {
    it('should create a country', async () => {
      const countryId = await countriesModule.create({
        isoCode: 'GB',
        defaultCurrencyCode: 'GBP',
      });

      assert.ok(countryId, 'Should return a country ID');
      assert.strictEqual(typeof countryId, 'string');
    });

    it('should find a country by ID', async () => {
      const countryId = await countriesModule.create({
        isoCode: 'US',
        defaultCurrencyCode: 'USD',
      });

      const country = await countriesModule.findCountry({ countryId });

      assert.ok(country, 'Should find the country');
      assert.strictEqual(country.isoCode, 'US');
      assert.strictEqual(country.defaultCurrencyCode, 'USD');
      assert.strictEqual(country.isActive, true);
    });

    it('should find a country by ISO code', async () => {
      const country = await countriesModule.findCountry({ isoCode: 'CH' });

      assert.ok(country, 'Should find the country');
      assert.strictEqual(country.isoCode, 'CH');
    });

    it('should update a country', async () => {
      const country = await countriesModule.findCountry({ isoCode: 'DE' });
      assert.ok(country);

      await countriesModule.update(country._id, {
        defaultCurrencyCode: 'CHF',
      });

      const updated = await countriesModule.findCountry({ countryId: country._id });
      assert.ok(updated);
      assert.strictEqual(updated.defaultCurrencyCode, 'CHF');
      assert.ok(updated.updated, 'Should have updated timestamp');
    });

    it('should soft-delete a country', async () => {
      const countryId = await countriesModule.create({
        isoCode: 'AT',
        defaultCurrencyCode: 'EUR',
      });

      const deleteCount = await countriesModule.delete(countryId);
      assert.strictEqual(deleteCount, 1);

      // Should not find deleted country by default
      const countries = await countriesModule.findCountries({});
      const atCountry = countries.find((c) => c.isoCode === 'AT');
      assert.ok(!atCountry, 'Deleted country should not be in results');
    });
  });

  describe('Query operations', () => {
    it('should find countries with pagination', async () => {
      const firstPage = await countriesModule.findCountries({ limit: 2, offset: 0 });
      assert.strictEqual(firstPage.length, 2, 'First page should have 2 countries');

      const secondPage = await countriesModule.findCountries({ limit: 2, offset: 2 });
      assert.ok(secondPage.length >= 1, 'Second page should have at least 1 country');
    });

    it('should filter by ISO codes', async () => {
      const countries = await countriesModule.findCountries({
        isoCodes: ['CH', 'DE'],
      });

      assert.ok(countries.length >= 1, 'Should find at least one country');
      for (const country of countries) {
        assert.ok(
          ['CH', 'DE'].includes(country.isoCode),
          `ISO code ${country.isoCode} should be CH or DE`,
        );
      }
    });

    it('should count countries', async () => {
      const count = await countriesModule.count({});
      assert.ok(count >= 5, `Expected at least 5 countries, got ${count}`);
    });

    it('should check country exists', async () => {
      const country = await countriesModule.findCountry({ isoCode: 'CH' });
      assert.ok(country, 'Should find CH country');

      const exists = await countriesModule.countryExists({ countryId: country._id });
      assert.strictEqual(exists, true, 'Country should exist');

      const notExists = await countriesModule.countryExists({ countryId: 'nonexistent' });
      assert.strictEqual(notExists, false, 'Non-existent country should not exist');
    });
  });

  describe('Helper functions', () => {
    it('should return flag emoji', async () => {
      const country = await countriesModule.findCountry({ isoCode: 'CH' });
      assert.ok(country);

      const emoji = countriesModule.flagEmoji(country);
      assert.ok(emoji.length > 0);
    });

    it('should return country name', async () => {
      const country = await countriesModule.findCountry({ isoCode: 'DE' });
      assert.ok(country);

      const name = countriesModule.name(country, new Intl.Locale('en'));
      assert.ok(name.includes('Germany') || name === 'DE');
    });
  });

  describe('Reactive subscriptions', () => {
    it('should support subscribe if available', async () => {
      if (countriesModule.subscribe) {
        let receivedCountries: unknown[] = [];
        const unsubscribe = countriesModule.subscribe({}, (countries) => {
          receivedCountries = countries;
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        assert.ok(receivedCountries.length > 0, 'Should receive initial data');

        unsubscribe();
      } else {
        assert.ok(true, 'Subscribe not available');
      }
    });
  });
});
