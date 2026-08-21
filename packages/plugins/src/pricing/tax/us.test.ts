import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  US_STATE_CODES,
  resolveUsSalesTaxRate,
  isProductExemptFromUsSalesTax,
  isDeliveryExemptFromUsSalesTax,
} from './us.ts';
import usTaxRates from './us-tax-rates.json' with { type: 'json' };

describe('resolveUsSalesTaxRate', () => {
  const at = new Date('2026-08-15T12:00:00Z');

  it('resolves statewide base rates', () => {
    assert.strictEqual(resolveUsSalesTaxRate({ regionCode: 'CA', referenceDate: at }), 0.0725);
    assert.strictEqual(resolveUsSalesTaxRate({ regionCode: 'NY', referenceDate: at }), 0.04);
    assert.strictEqual(resolveUsSalesTaxRate({ regionCode: 'TX', referenceDate: at }), 0.0625);
  });

  it('resolves 0% for the NOMAD states', () => {
    for (const state of ['NH', 'OR', 'MT', 'AK', 'DE']) {
      assert.strictEqual(resolveUsSalesTaxRate({ regionCode: state, referenceDate: at }), 0);
    }
  });

  it('resolves era history (LA 4.45% → 5% on 2025-01-01)', () => {
    assert.strictEqual(
      resolveUsSalesTaxRate({ regionCode: 'LA', referenceDate: new Date('2024-12-15T12:00:00Z') }),
      0.0445,
    );
    assert.strictEqual(
      resolveUsSalesTaxRate({ regionCode: 'LA', referenceDate: new Date('2025-01-15T12:00:00Z') }),
      0.05,
    );
  });

  it('applies already-enacted future eras only from their effective date (DC 7% from 2026-10-01)', () => {
    assert.strictEqual(
      resolveUsSalesTaxRate({ regionCode: 'DC', referenceDate: new Date('2026-09-15T12:00:00Z') }),
      0.06,
    );
    assert.strictEqual(
      resolveUsSalesTaxRate({ regionCode: 'DC', referenceDate: new Date('2026-10-15T12:00:00Z') }),
      0.07,
    );
  });

  it('normalizes case/whitespace and returns null for unknown states', () => {
    assert.strictEqual(resolveUsSalesTaxRate({ regionCode: ' ca ', referenceDate: at }), 0.0725);
    assert.strictEqual(resolveUsSalesTaxRate({ regionCode: 'XX', referenceDate: at }), null);
    assert.strictEqual(resolveUsSalesTaxRate({ regionCode: null }), null);
    assert.strictEqual(resolveUsSalesTaxRate({}), null);
  });
});

describe('isProductExemptFromUsSalesTax', () => {
  it('detects the us-tax-category:exempt tag', () => {
    assert.strictEqual(isProductExemptFromUsSalesTax({ tags: ['us-tax-category:exempt'] } as any), true);
    assert.strictEqual(
      isProductExemptFromUsSalesTax({ tags: ['  US-Tax-Category:Exempt  '] } as any),
      true,
    );
    assert.strictEqual(isProductExemptFromUsSalesTax({ tags: ['other'] } as any), false);
    assert.strictEqual(isProductExemptFromUsSalesTax({} as any), false);
  });
});

describe('isDeliveryExemptFromUsSalesTax', () => {
  it('detects the exempt provider configuration', () => {
    assert.strictEqual(
      isDeliveryExemptFromUsSalesTax({
        configuration: [{ key: 'us-tax-category', value: 'exempt' }],
      } as any),
      true,
    );
    assert.strictEqual(isDeliveryExemptFromUsSalesTax({ configuration: [] } as any), false);
    assert.strictEqual(isDeliveryExemptFromUsSalesTax(undefined as any), false);
  });
});

describe('us-tax-rates.json', () => {
  it('covers the 50 states + DC', () => {
    assert.strictEqual(US_STATE_CODES.length, 51);
    assert.ok(US_STATE_CODES.includes('DC'));
  });

  it('has strictly ascending eras with plausible rates', () => {
    for (const [stateCode, eras] of Object.entries(usTaxRates.states)) {
      let previous = 0;
      for (const era of eras as { validFrom: string; rate: number }[]) {
        const validFrom = new Date(`${era.validFrom}T00:00:00.000${usTaxRates.timezone}`);
        assert.ok(Number.isFinite(validFrom.getTime()), `${stateCode}: invalid ${era.validFrom}`);
        assert.ok(validFrom.getTime() > previous, `${stateCode}: eras out of order`);
        previous = validFrom.getTime();
        assert.ok(era.rate >= 0 && era.rate < 0.12, `${stateCode}: implausible rate ${era.rate}`);
      }
    }
  });

  it('carries source and verification metadata', () => {
    assert.match(usTaxRates.source, /^https:\/\//);
    assert.ok(Number.isFinite(new Date(usTaxRates.verifiedAt).getTime()));
  });
});
