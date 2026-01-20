import { describe, it } from 'node:test';
import assert from 'node:assert';
import { determineFallbackLocale, resolveBestSupported, resolveBestCurrency } from './locale-helpers.ts';

describe('locale-helpers', () => {
  describe('determineFallbackLocale', () => {
    it('should return system locale matching country and language', () => {
      const countries = [{ isoCode: 'CH' }, { isoCode: 'DE' }];
      const languages = [{ isoCode: 'de' }, { isoCode: 'en' }];
      const result = determineFallbackLocale(countries, languages);
      assert.strictEqual(result.language, 'de');
      assert.strictEqual(result.region, 'CH');
    });

    it('should fallback to first country if system country not found', () => {
      const countries = [{ isoCode: 'US' }, { isoCode: 'UK' }];
      const languages = [{ isoCode: 'de' }];
      const result = determineFallbackLocale(countries, languages);
      assert.strictEqual(result.region, 'US');
    });

    it('should fallback to first language if system language not found', () => {
      const countries = [{ isoCode: 'CH' }];
      const languages = [{ isoCode: 'fr' }, { isoCode: 'it' }];
      const result = determineFallbackLocale(countries, languages);
      assert.strictEqual(result.language, 'fr');
    });

    it('should handle empty arrays', () => {
      const result = determineFallbackLocale([], []);
      assert.ok(result instanceof Intl.Locale);
    });
  });

  describe('resolveBestSupported', () => {
    const countries = [{ isoCode: 'CH' }, { isoCode: 'DE' }];
    const languages = [{ isoCode: 'de' }, { isoCode: 'en' }];

    it('should resolve exact match from accept-language header', () => {
      const result = resolveBestSupported('de-CH', '', { countries, languages });
      assert.strictEqual(result.baseName, 'de-CH');
    });

    it('should resolve language match when country not in accept header', () => {
      const result = resolveBestSupported('de', '', { countries, languages });
      assert.strictEqual(result.language, 'de');
    });

    it('should filter by acceptCountry when provided and fallback is in list', () => {
      // When acceptCountry is CH (matching fallback), supportedLocales include the fallback
      const result = resolveBestSupported('de-CH', 'CH', { countries, languages });
      assert.strictEqual(result.region, 'CH');
    });

    it('should fallback when acceptCountry excludes fallback locale', () => {
      // When acceptCountry filters to only DE, the fallback (de-CH) is not in supported list
      // This causes resolve-accept-language to throw, returning fallback locale
      const result = resolveBestSupported('de-DE', 'DE', { countries, languages });
      // Falls back to system locale (de-CH) because DE is not in fallback
      assert.ok(result instanceof Intl.Locale);
    });

    it('should fallback when no match found', () => {
      const result = resolveBestSupported('zh-CN', '', { countries, languages });
      assert.ok(result instanceof Intl.Locale);
    });

    it('should handle empty accept-language', () => {
      const result = resolveBestSupported('', '', { countries, languages });
      assert.ok(result instanceof Intl.Locale);
    });
  });

  describe('resolveBestCurrency', () => {
    const currencies = [{ isoCode: 'CHF' }, { isoCode: 'EUR' }, { isoCode: 'USD' }];

    it('should return matching currency when found', () => {
      const result = resolveBestCurrency('EUR', currencies);
      assert.strictEqual(result, 'EUR');
    });

    it('should match currency case-insensitively', () => {
      const result = resolveBestCurrency('eur', currencies);
      assert.strictEqual(result, 'EUR');
    });

    it('should fallback to system currency when not found', () => {
      const result = resolveBestCurrency('GBP', currencies);
      assert.strictEqual(result, 'CHF');
    });

    it('should fallback to first currency when system currency not in list', () => {
      const limitedCurrencies = [{ isoCode: 'EUR' }, { isoCode: 'USD' }];
      const result = resolveBestCurrency('GBP', limitedCurrencies);
      assert.strictEqual(result, 'EUR');
    });

    it('should fallback when currencyCode is null', () => {
      const result = resolveBestCurrency(null, currencies);
      assert.strictEqual(result, 'CHF');
    });

    it('should handle empty currency list', () => {
      const result = resolveBestCurrency('EUR', []);
      assert.strictEqual(result, undefined);
    });
  });
});
