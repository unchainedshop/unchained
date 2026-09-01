import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SwissTaxCategories,
  resolveTaxCategoryFromDeliveryProvider,
  resolveTaxCategoryFromProduct,
} from './ch.ts';
import swissTaxRates from './ch-tax-rates.json' with { type: 'json' };

describe('SwissTaxCategories', () => {
  it('DEFAULT rate', () => {
    assert.strictEqual(SwissTaxCategories.DEFAULT.rate(new Date(2023, 1, 1)), 0.077);
    assert.strictEqual(SwissTaxCategories.DEFAULT.rate(new Date(2024, 1, 1)), 0.081);
  });

  it('REDUCED rate', () => {
    assert.strictEqual(SwissTaxCategories.REDUCED.rate(new Date(2023, 1, 1)), 0.025);
    assert.strictEqual(SwissTaxCategories.REDUCED.rate(new Date(2024, 1, 1)), 0.026);
  });

  it('SPECIAL rate', () => {
    assert.strictEqual(SwissTaxCategories.SPECIAL.rate(new Date(2023, 1, 1)), 0.037);
    assert.strictEqual(SwissTaxCategories.SPECIAL.rate(new Date(2024, 1, 1)), 0.038);
  });

  it('uses current date by default', () => {
    const rate = SwissTaxCategories.DEFAULT.rate();
    assert.strictEqual(rate, 0.081);
  });

  it('resolves historical eras (2011-2017 and 2001-2010)', () => {
    assert.strictEqual(SwissTaxCategories.DEFAULT.rate(new Date(2015, 5, 15)), 0.08);
    assert.strictEqual(SwissTaxCategories.REDUCED.rate(new Date(2015, 5, 15)), 0.025);
    assert.strictEqual(SwissTaxCategories.SPECIAL.rate(new Date(2015, 5, 15)), 0.038);
    assert.strictEqual(SwissTaxCategories.DEFAULT.rate(new Date(2005, 5, 15)), 0.076);
    assert.strictEqual(SwissTaxCategories.REDUCED.rate(new Date(2005, 5, 15)), 0.024);
    assert.strictEqual(SwissTaxCategories.SPECIAL.rate(new Date(2005, 5, 15)), 0.036);
  });

  it('clamps dates before the first recorded era to the earliest rate', () => {
    assert.strictEqual(SwissTaxCategories.DEFAULT.rate(new Date(1999, 0, 1)), 0.076);
  });

  it('switches eras exactly at midnight Swiss time', () => {
    assert.strictEqual(
      SwissTaxCategories.DEFAULT.rate(new Date('2023-12-31T23:59:59.999+01:00')),
      0.077,
    );
    assert.strictEqual(
      SwissTaxCategories.DEFAULT.rate(new Date('2024-01-01T00:00:00.000+01:00')),
      0.081,
    );
  });
});

describe('ch-tax-rates.json', () => {
  it('covers all three Swiss tax categories', () => {
    assert.deepStrictEqual(Object.keys(swissTaxRates.categories).sort(), [
      'default',
      'reduced',
      'special',
    ]);
  });

  it('has strictly ascending eras with plausible rates', () => {
    for (const eras of Object.values(swissTaxRates.categories)) {
      assert.ok(eras.length > 0);
      let previous = 0;
      for (const era of eras) {
        const validFrom = new Date(`${era.validFrom}T00:00:00.000${swissTaxRates.timezone}`);
        assert.ok(Number.isFinite(validFrom.getTime()), `invalid validFrom ${era.validFrom}`);
        assert.ok(validFrom.getTime() > previous, `eras out of order at ${era.validFrom}`);
        previous = validFrom.getTime();
        assert.ok(era.rate > 0 && era.rate < 0.15, `implausible rate ${era.rate}`);
      }
    }
  });

  it('carries source and verification metadata', () => {
    assert.match(swissTaxRates.source, /^https:\/\/www\.estv\.admin\.ch\//);
    assert.ok(Number.isFinite(new Date(swissTaxRates.verifiedAt).getTime()));
  });
});

describe('resolveTaxCategoryFromDeliveryProvider', () => {
  it('should return tax category from provider configuration', () => {
    const provider = {
      configuration: [{ key: 'swiss-tax-category', value: 'reduced' }],
    } as any;
    const result = resolveTaxCategoryFromDeliveryProvider(provider);
    assert.strictEqual(result, SwissTaxCategories.REDUCED);
  });

  it('should return null for unknown tax category', () => {
    const provider = {
      configuration: [{ key: 'swiss-tax-category', value: 'unknown' }],
    } as any;
    const result = resolveTaxCategoryFromDeliveryProvider(provider);
    assert.strictEqual(result, undefined);
  });

  it('should return null when no swiss-tax-category in config', () => {
    const provider = {
      configuration: [{ key: 'other-key', value: 'value' }],
    } as any;
    const result = resolveTaxCategoryFromDeliveryProvider(provider);
    assert.strictEqual(result, null);
  });

  it('should return null for empty configuration', () => {
    const provider = { configuration: [] } as any;
    const result = resolveTaxCategoryFromDeliveryProvider(provider);
    assert.strictEqual(result, null);
  });

  it('should return null for undefined provider', () => {
    const result = resolveTaxCategoryFromDeliveryProvider(undefined as any);
    assert.strictEqual(result, null);
  });
});

describe('resolveTaxCategoryFromProduct', () => {
  it('should return tax category from product tags', () => {
    const product = {
      tags: ['swiss-tax-category:reduced'],
    } as any;
    const result = resolveTaxCategoryFromProduct(product);
    assert.strictEqual(result, SwissTaxCategories.REDUCED);
  });

  it('should handle tag with extra whitespace', () => {
    const product = {
      tags: ['  swiss-tax-category:special  '],
    } as any;
    const result = resolveTaxCategoryFromProduct(product);
    assert.strictEqual(result, SwissTaxCategories.SPECIAL);
  });

  it('should return null for unknown tax category', () => {
    const product = {
      tags: ['swiss-tax-category:unknown'],
    } as any;
    const result = resolveTaxCategoryFromProduct(product);
    assert.strictEqual(result, null);
  });

  it('should return null when no swiss-tax-category tag', () => {
    const product = {
      tags: ['other-tag', 'another-tag'],
    } as any;
    const result = resolveTaxCategoryFromProduct(product);
    assert.strictEqual(result, null);
  });

  it('should return null for empty tags', () => {
    const product = { tags: [] } as any;
    const result = resolveTaxCategoryFromProduct(product);
    assert.strictEqual(result, null);
  });

  it('should return null for undefined tags', () => {
    const product = {} as any;
    const result = resolveTaxCategoryFromProduct(product);
    assert.strictEqual(result, null);
  });
});
