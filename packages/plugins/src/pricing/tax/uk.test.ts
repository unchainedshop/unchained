import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  UkTaxCategories,
  UK_VAT_COUNTRY_CODES,
  resolveUkTaxCategoryFromDeliveryProvider,
  resolveUkTaxCategoryFromProduct,
} from './uk.ts';
import ukTaxRates from './uk-tax-rates.json' with { type: 'json' };

describe('UkTaxCategories', () => {
  it('STANDARD rate era history (17.5 → 15 → 17.5 → 20)', () => {
    assert.strictEqual(UkTaxCategories.STANDARD.rate(new Date('2008-06-15T12:00:00Z')), 0.175);
    assert.strictEqual(UkTaxCategories.STANDARD.rate(new Date('2009-06-15T12:00:00Z')), 0.15);
    assert.strictEqual(UkTaxCategories.STANDARD.rate(new Date('2010-06-15T12:00:00Z')), 0.175);
    assert.strictEqual(UkTaxCategories.STANDARD.rate(new Date('2026-08-15T12:00:00Z')), 0.2);
  });

  it('switches to 20% exactly on 2011-01-04', () => {
    assert.strictEqual(UkTaxCategories.STANDARD.rate(new Date('2011-01-03T23:59:59Z')), 0.175);
    assert.strictEqual(UkTaxCategories.STANDARD.rate(new Date('2011-01-04T00:00:00Z')), 0.2);
  });

  it('REDUCED rate (8% fuel-and-power era, 5% since 1997-09-01)', () => {
    assert.strictEqual(UkTaxCategories.REDUCED.rate(new Date('1995-06-15T12:00:00Z')), 0.08);
    assert.strictEqual(UkTaxCategories.REDUCED.rate(new Date('2026-08-15T12:00:00Z')), 0.05);
  });

  it('ZERO rate is zero', () => {
    assert.strictEqual(UkTaxCategories.ZERO.rate(new Date('2026-08-15T12:00:00Z')), 0);
  });

  it('covers the UK VAT area country codes', () => {
    assert.deepStrictEqual(UK_VAT_COUNTRY_CODES, ['GB', 'IM']);
  });
});

describe('resolveUkTaxCategoryFromProduct', () => {
  it('resolves the category from the uk-tax-category tag', () => {
    assert.strictEqual(
      resolveUkTaxCategoryFromProduct({ tags: ['uk-tax-category:zero'] } as any),
      UkTaxCategories.ZERO,
    );
    assert.strictEqual(
      resolveUkTaxCategoryFromProduct({ tags: ['  UK-Tax-Category:Reduced  '] } as any),
      UkTaxCategories.REDUCED,
    );
  });

  it('returns null for unknown or missing tags', () => {
    assert.strictEqual(resolveUkTaxCategoryFromProduct({ tags: ['uk-tax-category:x'] } as any), null);
    assert.strictEqual(resolveUkTaxCategoryFromProduct({ tags: [] } as any), null);
    assert.strictEqual(resolveUkTaxCategoryFromProduct({} as any), null);
  });
});

describe('resolveUkTaxCategoryFromDeliveryProvider', () => {
  it('resolves the category from provider configuration', () => {
    assert.strictEqual(
      resolveUkTaxCategoryFromDeliveryProvider({
        configuration: [{ key: 'uk-tax-category', value: 'zero' }],
      } as any),
      UkTaxCategories.ZERO,
    );
  });

  it('returns null without a matching configuration entry', () => {
    assert.strictEqual(resolveUkTaxCategoryFromDeliveryProvider({ configuration: [] } as any), null);
    assert.strictEqual(resolveUkTaxCategoryFromDeliveryProvider(undefined as any), null);
  });
});

describe('uk-tax-rates.json', () => {
  it('covers standard, reduced and zero categories', () => {
    assert.deepStrictEqual(Object.keys(ukTaxRates.categories).sort(), ['reduced', 'standard', 'zero']);
  });

  it('has strictly ascending eras with plausible rates', () => {
    for (const [category, eras] of Object.entries(ukTaxRates.categories)) {
      let previous = 0;
      for (const era of eras) {
        const validFrom = new Date(`${era.validFrom}T00:00:00.000${ukTaxRates.timezone}`);
        assert.ok(Number.isFinite(validFrom.getTime()), `${category}: invalid ${era.validFrom}`);
        assert.ok(validFrom.getTime() > previous, `${category}: eras out of order`);
        previous = validFrom.getTime();
        assert.ok(era.rate >= 0 && era.rate < 0.3, `${category}: implausible rate ${era.rate}`);
      }
    }
  });

  it('carries source and verification metadata', () => {
    assert.match(ukTaxRates.source, /^https:\/\/www\.gov\.uk\//);
    assert.ok(Number.isFinite(new Date(ukTaxRates.verifiedAt).getTime()));
  });
});
