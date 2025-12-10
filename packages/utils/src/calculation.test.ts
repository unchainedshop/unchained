import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  applyRate,
  roundToNext,
  resolveAmountAndTax,
  applyDiscountToMultipleShares,
  calculateAmountToSplit,
} from './calculation.ts';

describe('roundToNext', () => {
  it('rounds to the next multiple of precision correctly when the value is positive', () => {
    assert.strictEqual(roundToNext(5, 2), 6);
    assert.strictEqual(roundToNext(10, 5), 10);
    assert.strictEqual(roundToNext(13, 5), 15);
  });

  it('rounds to the next multiple of precision correctly when the value is negative', () => {
    assert.strictEqual(roundToNext(-5, 2), -4);
    assert.strictEqual(roundToNext(-10, 5), -10);
    assert.strictEqual(roundToNext(-13, 5), -10);
  });

  it('returns 0 when the value is 0', () => {
    assert.strictEqual(roundToNext(0, 5), 0);
  });

  it('returns the same value when the precision is 1', () => {
    assert.strictEqual(roundToNext(5, 1), 5);
  });
});

describe('resolveAmountAndTax', () => {
  it('ratio is 0 and taxDivisor is 0', () => {
    const result = resolveAmountAndTax({ ratio: 0, taxDivisor: 0 }, 100);
    assert.deepStrictEqual(result, [0, 0]);
  });

  it('ratio is not 0 and taxDivisor is 0', () => {
    const result = resolveAmountAndTax({ ratio: 0.5, taxDivisor: 0 }, 100);
    assert.deepStrictEqual(result, [50, 0]);
  });

  it('ratio is 0 and taxDivisor is not 0', () => {
    const result = resolveAmountAndTax({ ratio: 0, taxDivisor: 2 }, 100);
    assert.deepStrictEqual(result, [0, 0]);
  });

  it('ratio and taxDivisor are not 0', () => {
    const result = resolveAmountAndTax({ ratio: 0.5, taxDivisor: 2 }, 100);
    assert.deepStrictEqual(result, [50, 25]);
  });

  it('ratio and taxDivisor are not finite number', () => {
    const result = resolveAmountAndTax({ ratio: Number.NaN, taxDivisor: Number.NaN }, 100);
    assert.deepStrictEqual(result, [0, 0]);
  });
});

describe('applyDiscountToMultipleShares', () => {
  it('shares are empty', () => {
    const result = applyDiscountToMultipleShares([], 100);
    assert.deepStrictEqual(result, [0, 0]);
  });

  it('shares have one share', () => {
    const shares = [{ ratio: 0.5, taxDivisor: 2 }];
    const result = applyDiscountToMultipleShares(shares, 100);
    assert.deepStrictEqual(result, [50, 25]);
  });

  it('shares have multiple shares', () => {
    const shares = [
      { ratio: 0.5, taxDivisor: 2 },
      { ratio: 0.2, taxDivisor: 1.5 },
    ];
    const result = applyDiscountToMultipleShares(shares, 100);
    assert.deepStrictEqual(result, [70, 31.666666666666664]);
  });
});

describe('applyRate', () => {
  it('applies the rate correctly when a rate is provided', () => {
    const configuration = {
      rate: 0.1,
    };
    const amount = 100;
    assert.strictEqual(applyRate(configuration, amount), 10);
  });

  it('applies the fixed rate correctly when a fixed rate is provided', () => {
    const configuration = {
      fixedRate: 50,
    };
    const amount = 100;
    assert.strictEqual(applyRate(configuration, amount), 50);
  });

  it('applies the fixed rate correctly when a fixed rate is provided and the amount is less than fixed rate', () => {
    const configuration = {
      fixedRate: 150,
    };
    const amount = 100;
    assert.strictEqual(applyRate(configuration, amount), 100);
  });

  it('applies the rate correctly when rate is less than or equal to 0', () => {
    const configuration = {
      rate: -0.1,
    };
    const amount = 100;
    assert.strictEqual(applyRate(configuration, amount), -10);
  });

  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1,
    };
    const amount = -100;
    assert.strictEqual(applyRate(configuration, amount), -10);
  });

  it('returns 0 when rate and fixed rate are not provided', () => {
    const configuration = {};
    const amount = 100;
    assert.strictEqual(applyRate(configuration, amount), 0);
  });
});

describe('calculateAmountToSplit', () => {
  it('calculates the correct amount to split when using a rate', () => {
    const configuration = {
      rate: 0.1,
    };
    const amount = 1000;
    assert.strictEqual(calculateAmountToSplit(configuration, amount), 100);
  });

  it('calculates the correct amount to split when using a fixed rate', () => {
    const configuration = {
      fixedRate: 50,
    };
    const amount = 1000;
    assert.strictEqual(calculateAmountToSplit(configuration, amount), 50);
  });

  it('returns 0 when the amount is less than or equal to 0', () => {
    const configuration = {
      rate: 0.1,
    };
    const amount = 0;
    assert.strictEqual(calculateAmountToSplit(configuration, amount), 0);
  });

  it('returns 0 when amount is negative', () => {
    const configuration = {
      rate: 0.1,
    };
    const amount = -1000;
    assert.strictEqual(calculateAmountToSplit(configuration, amount), 0);
  });

  it('returns 0 when configuration rate is negative', () => {
    const configuration = {
      rate: -0.1,
    };
    const amount = 1000;
    assert.strictEqual(calculateAmountToSplit(configuration, amount), 0);
  });
});
