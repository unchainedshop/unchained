import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SwissTaxCategories } from './ch.ts';

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
});
