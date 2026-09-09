import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  EU_MEMBER_COUNTRY_CODES,
  isEuMemberCountry,
  resolveEuTaxRate,
  resolveEuTaxCategoryFromProduct,
  resolveEuTaxCategoryFromDeliveryProvider,
} from './eu.ts';
import euTaxRates from './eu-tax-rates.json' with { type: 'json' };

describe('resolveEuTaxRate', () => {
  it('resolves current standard rates per destination country', () => {
    const at = new Date('2026-08-01T12:00:00Z');
    assert.strictEqual(resolveEuTaxRate({ countryCode: 'DE', referenceDate: at }), 0.19);
    assert.strictEqual(resolveEuTaxRate({ countryCode: 'FR', referenceDate: at }), 0.2);
    assert.strictEqual(resolveEuTaxRate({ countryCode: 'HU', referenceDate: at }), 0.27);
    assert.strictEqual(resolveEuTaxRate({ countryCode: 'LU', referenceDate: at }), 0.17);
  });

  it('resolves era history including temporary cuts (DE COVID 16%)', () => {
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'DE', referenceDate: new Date('2020-08-15T12:00:00Z') }),
      0.16,
    );
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'DE', referenceDate: new Date('2021-01-15T12:00:00Z') }),
      0.19,
    );
  });

  it('resolves recent rate changes (RO 2025-08, EE 2025-07, SK 2025-01, FI 2024-09)', () => {
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'RO', referenceDate: new Date('2025-07-15T12:00:00Z') }),
      0.19,
    );
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'RO', referenceDate: new Date('2025-08-15T12:00:00Z') }),
      0.21,
    );
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'EE', referenceDate: new Date('2025-08-15T12:00:00Z') }),
      0.24,
    );
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'SK', referenceDate: new Date('2025-02-15T12:00:00Z') }),
      0.23,
    );
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'FI', referenceDate: new Date('2024-10-15T12:00:00Z') }),
      0.255,
    );
  });

  it('preserves the previous Estonian accommodation rate', () => {
    assert.strictEqual(
      resolveEuTaxRate({
        countryCode: 'EE',
        category: 'reduced2',
        referenceDate: new Date('2024-08-01T12:00:00Z'),
      }),
      0.09,
    );
    assert.strictEqual(
      resolveEuTaxRate({
        countryCode: 'EE',
        category: 'reduced2',
        referenceDate: new Date('2025-02-01T12:00:00Z'),
      }),
      0.13,
    );
  });

  it('switches Romanian rates at midnight in Romania', () => {
    assert.strictEqual(
      resolveEuTaxRate({
        countryCode: 'RO',
        referenceDate: new Date('2025-07-31T20:59:59.999Z'),
      }),
      0.19,
    );
    assert.strictEqual(
      resolveEuTaxRate({
        countryCode: 'RO',
        referenceDate: new Date('2025-07-31T21:00:00.000Z'),
      }),
      0.21,
    );
  });

  it('resolves non-standard categories where the country has them', () => {
    const at = new Date('2026-08-01T12:00:00Z');
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'FR', category: 'super_reduced', referenceDate: at }),
      0.021,
    );
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'AT', category: 'reduced2', referenceDate: at }),
      0.13,
    );
    assert.strictEqual(
      resolveEuTaxRate({ countryCode: 'DE', category: 'reduced', referenceDate: at }),
      0.07,
    );
  });

  it('falls back to the standard rate for categories a country does not have', () => {
    // Denmark has no reduced rates at all
    assert.strictEqual(
      resolveEuTaxRate({
        countryCode: 'DK',
        category: 'reduced',
        referenceDate: new Date('2026-08-01T12:00:00Z'),
      }),
      0.25,
    );
  });

  it('returns null for non-EU destinations', () => {
    assert.strictEqual(resolveEuTaxRate({ countryCode: 'CH' }), null);
    assert.strictEqual(resolveEuTaxRate({ countryCode: 'US' }), null);
    assert.strictEqual(resolveEuTaxRate({ countryCode: null }), null);
    assert.strictEqual(resolveEuTaxRate({}), null);
  });

  it('accepts both GR (ISO) and EL (EU convention) for Greece', () => {
    const at = new Date('2026-08-01T12:00:00Z');
    assert.strictEqual(resolveEuTaxRate({ countryCode: 'GR', referenceDate: at }), 0.24);
    assert.strictEqual(resolveEuTaxRate({ countryCode: 'el', referenceDate: at }), 0.24);
  });
});

describe('isEuMemberCountry', () => {
  it('recognizes members case-insensitively and rejects the rest', () => {
    assert.strictEqual(isEuMemberCountry('de'), true);
    assert.strictEqual(isEuMemberCountry(' FR '), true);
    assert.strictEqual(isEuMemberCountry('EL'), true);
    assert.strictEqual(isEuMemberCountry('CH'), false);
    assert.strictEqual(isEuMemberCountry(undefined), false);
  });
});

describe('resolveEuTaxCategoryFromProduct', () => {
  it('extracts the category from the eu-tax-category tag', () => {
    assert.strictEqual(
      resolveEuTaxCategoryFromProduct({ tags: ['eu-tax-category:reduced'] } as any),
      'reduced',
    );
    assert.strictEqual(
      resolveEuTaxCategoryFromProduct({ tags: ['  EU-Tax-Category:Super_Reduced  '] } as any),
      'super_reduced',
    );
  });

  it('returns null without a matching tag', () => {
    assert.strictEqual(resolveEuTaxCategoryFromProduct({ tags: ['other'] } as any), null);
    assert.strictEqual(resolveEuTaxCategoryFromProduct({ tags: [] } as any), null);
    assert.strictEqual(resolveEuTaxCategoryFromProduct({} as any), null);
  });
});

describe('resolveEuTaxCategoryFromDeliveryProvider', () => {
  it('reads the eu-tax-category configuration entry', () => {
    assert.strictEqual(
      resolveEuTaxCategoryFromDeliveryProvider({
        configuration: [{ key: 'eu-tax-category', value: 'reduced' }],
      } as any),
      'reduced',
    );
  });

  it('returns null without configuration', () => {
    assert.strictEqual(resolveEuTaxCategoryFromDeliveryProvider({ configuration: [] } as any), null);
    assert.strictEqual(resolveEuTaxCategoryFromDeliveryProvider(undefined as any), null);
  });
});

describe('eu-tax-rates.json', () => {
  it('covers all 27 member states, each with a standard category', () => {
    assert.strictEqual(EU_MEMBER_COUNTRY_CODES.length, 27);
    for (const [countryCode, categories] of Object.entries(euTaxRates.countries)) {
      assert.ok('standard' in categories, `${countryCode} lacks a standard category`);
    }
  });

  it('has strictly ascending eras with plausible rates', () => {
    for (const [countryCode, categories] of Object.entries(euTaxRates.countries)) {
      const timeZone = euTaxRates.timezones[countryCode as keyof typeof euTaxRates.timezones];
      assert.doesNotThrow(() => new Intl.DateTimeFormat('en-US', { timeZone }));
      for (const [category, eras] of Object.entries(categories)) {
        let previous = '';
        for (const era of eras as { validFrom: string; rate: number }[]) {
          assert.match(era.validFrom, /^\d{4}-\d{2}-\d{2}$/);
          assert.ok(
            era.validFrom > previous,
            `${countryCode}.${category}: eras out of order at ${era.validFrom}`,
          );
          previous = era.validFrom;
          assert.ok(
            era.rate > 0 && era.rate < 0.3,
            `${countryCode}.${category}: implausible rate ${era.rate}`,
          );
        }
      }
    }
  });

  it('carries source and verification metadata', () => {
    assert.match(euTaxRates.source, /^https:\/\/ec\.europa\.eu\//);
    assert.ok(Number.isFinite(new Date(euTaxRates.verifiedAt).getTime()));
    assert.deepStrictEqual(
      Object.keys(euTaxRates.timezones).sort(),
      [...EU_MEMBER_COUNTRY_CODES].sort(),
    );
  });
});
