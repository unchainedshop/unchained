import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SwissTaxCategories,
  resolveTaxCategoryFromDeliveryProvider,
  resolveTaxCategoryFromProduct,
} from './ch.ts';

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
