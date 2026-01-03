/**
 * Tests for the Countries Module with Drizzle ORM
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createTestDb, type DrizzleDbConnection } from '@unchainedshop/store';
import { initializeCountriesSchema } from '../db/index.ts';
import { configureCountriesModule, type CountriesModule } from './configureCountriesModule.ts';

describe('Countries Module', () => {
  let connection: DrizzleDbConnection;
  let countriesModule: CountriesModule;

  before(async () => {
    // Create in-memory SQLite database for testing
    connection = createTestDb();
    await initializeCountriesSchema(connection.db);

    countriesModule = await configureCountriesModule({ db: connection.db });

    // Seed test data
    await countriesModule.create({ isoCode: 'CH', defaultCurrencyCode: 'CHF' });
    await countriesModule.create({ isoCode: 'DE', defaultCurrencyCode: 'EUR' });
    await countriesModule.create({ isoCode: 'FR', defaultCurrencyCode: 'EUR' });
    await countriesModule.create({ isoCode: 'IT', defaultCurrencyCode: 'EUR' });
    await countriesModule.create({ isoCode: 'ES', defaultCurrencyCode: 'EUR' });
  });

  after(async () => {
    connection.close();
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

    it('should check if country is base', async () => {
      const country = await countriesModule.findCountry({ isoCode: 'CH' });
      assert.ok(country);

      // CH is the default system region, so it should be base
      const isBase = countriesModule.isBase(country);
      assert.strictEqual(isBase, true, 'CH should be the base country');
    });
  });

  describe('Field projection', () => {
    it('should return only specified fields', async () => {
      const countries = await countriesModule.findCountries(
        {},
        { fields: ['isoCode', 'defaultCurrencyCode'] },
      );

      assert.ok(countries.length >= 1, 'Should find at least one country');
      const country = countries[0];

      // Should have the requested fields
      assert.ok('isoCode' in country, 'Should have isoCode');
      assert.ok('defaultCurrencyCode' in country, 'Should have defaultCurrencyCode');

      // Should NOT have other fields
      assert.ok(!('created' in country), 'Should not have created');
      assert.ok(!('updated' in country), 'Should not have updated');
      assert.ok(!('isActive' in country), 'Should not have isActive');
    });

    it('should return all fields when no projection specified', async () => {
      const countries = await countriesModule.findCountries({});

      assert.ok(countries.length >= 1, 'Should find at least one country');
      const country = countries[0];

      // Should have all fields
      assert.ok('_id' in country, 'Should have _id');
      assert.ok('isoCode' in country, 'Should have isoCode');
      assert.ok('created' in country, 'Should have created');
      assert.ok('isActive' in country, 'Should have isActive');
    });
  });

  describe('Sorting', () => {
    it('should sort countries by isoCode ascending', async () => {
      const countries = await countriesModule.findCountries({
        sort: [{ key: 'isoCode', value: 'ASC' }],
      });

      assert.ok(countries.length >= 2, 'Should have at least 2 countries');

      // Check that countries are sorted ascending by isoCode
      for (let i = 1; i < countries.length; i++) {
        assert.ok(
          countries[i].isoCode >= countries[i - 1].isoCode,
          `${countries[i].isoCode} should be >= ${countries[i - 1].isoCode}`,
        );
      }
    });

    it('should sort countries by isoCode descending', async () => {
      const countries = await countriesModule.findCountries({
        sort: [{ key: 'isoCode', value: 'DESC' }],
      });

      assert.ok(countries.length >= 2, 'Should have at least 2 countries');

      // Check that countries are sorted descending by isoCode
      for (let i = 1; i < countries.length; i++) {
        assert.ok(
          countries[i].isoCode <= countries[i - 1].isoCode,
          `${countries[i].isoCode} should be <= ${countries[i - 1].isoCode}`,
        );
      }
    });
  });
});
