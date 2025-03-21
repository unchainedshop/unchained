import { describe, it } from 'node:test';
import { resolveRatioAndTaxDivisorForPricingSheet } from './BasePricingSheet';
import assert from 'node:assert';

describe('resolveRatioAndTaxDivisorForPricingSheet', () => {
  it('total is 0 and pricing is provided', () => {
    const pricing: any = {
      taxSum: () => 10,
      gross: () => 20,
      net: () => 10,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 0);
    assert.deepStrictEqual(result, { ratio: 1, taxDivisor: 1 });
  });

  it('gross - tax is 0', () => {
    const pricing: any = {
      taxSum: () => 10,
      gross: () => 10,
      net: () => 0,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 20);
    assert.deepStrictEqual(result, { ratio: 0, taxDivisor: 0 });
  });

  it('gross - tax is not 0', () => {
    const pricing: any = {
      taxSum: () => 10,
      gross: () => 20,
      net: () => 10,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 20);
    assert.deepStrictEqual(result, { ratio: 1, taxDivisor: 2 });
  });

  it('taxSum is 0', () => {
    const pricing: any = {
      taxSum: () => 0,
      gross: () => 20,
      net: () => 20,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 20);
    assert.deepStrictEqual(result, { ratio: 1, taxDivisor: 1 });
  });
});
