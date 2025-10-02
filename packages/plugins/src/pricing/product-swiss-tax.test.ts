import { describe, it } from 'node:test';
import assert from 'node:assert';

import { getTaxRate } from './product-swiss-tax.js';

describe('ProductSwissTax', () => {
  describe('getTaxRate', () => {
    it('default rate', () => {
      assert.strictEqual(
        getTaxRate({
          product: {} as any,
          order: {} as any,
        } as any),
        0.081,
      );
    });

    it('reduced rate', () => {
      assert.strictEqual(
        getTaxRate({
          product: {
            tags: ['swiss-tax-category:reduced'],
          },
          order: {},
        } as any),
        0.026,
      );
    });

    it('special rate', () => {
      assert.strictEqual(
        getTaxRate({
          product: {
            tags: ['swiss-tax-category:special'],
          },
          order: {},
        } as any),
        0.038,
      );
    });

    it('default rate', () => {
      assert.strictEqual(
        getTaxRate({
          product: {
            tags: ['swiss-tax-category:default'],
          },
          order: {},
        } as any),
        0.081,
      );
    });
  });
});
