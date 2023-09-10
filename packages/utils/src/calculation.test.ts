import { applyRate, resolveRatioAndTaxDivisorForPricingSheet, roundToNext, resolveAmountAndTax, applyDiscountToMultipleShares, calculateAmountToSplit } from "./calculation";

describe('roundToNext', () => {
  it('rounds to the next multiple of precision correctly when the value is positive', () => {
    expect(roundToNext(5, 2)).toBe(6);
    expect(roundToNext(10, 5)).toBe(10);
    expect(roundToNext(13, 5)).toBe(15);
  });

  it('rounds to the next multiple of precision correctly when the value is negative', () => {
    expect(roundToNext(-5, 2)).toBe(-4);
    expect(roundToNext(-10, 5)).toBe(-10);
    expect(roundToNext(-13, 5)).toBe(-10);
  });

  it('returns 0 when the value is 0', () => {
    expect(roundToNext(0, 5)).toBe(0);
  });

  it('returns the same value when the precision is 1', () => {
    expect(roundToNext(5, 1)).toBe(5);
  });

});

describe("resolveRatioAndTaxDivisorForPricingSheet", () => {
  it('total is 0 and pricing is provided', () => {
    const pricing: any = {
      taxSum: () => 10,
      gross: () => 20,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 0);
    expect(result).toEqual({ ratio: 1, taxDivisor: 1 });
  });

  it('gross - tax is 0', () => {
    const pricing: any = {
      taxSum: () => 10,
      gross: () => 10,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 20);
    expect(result).toEqual({ ratio: 0, taxDivisor: 0 });
  });

  it('gross - tax is not 0', () => {
    const pricing: any = {
      taxSum: () => 10,
      gross: () => 20,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 20);
    expect(result).toEqual({ ratio: 1, taxDivisor: 2 });
  });

  it('taxSum is 0', () => {
    const pricing: any = {
      taxSum: () => 0,
      gross: () => 20,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 20);
    expect(result).toEqual({ ratio: 1, taxDivisor: 1 });
  });

})


describe("resolveAmountAndTax", () => {
  it('ratio is 0 and taxDivisor is 0', () => {
    const result = resolveAmountAndTax({ ratio: 0, taxDivisor: 0 }, 100);
    expect(result).toEqual([0, 0]);
  });

  it('ratio is not 0 and taxDivisor is 0', () => {
    const result = resolveAmountAndTax({ ratio: 0.5, taxDivisor: 0 }, 100);
    expect(result).toEqual([50, 0]);
  });

  it('ratio is 0 and taxDivisor is not 0', () => {
    const result = resolveAmountAndTax({ ratio: 0, taxDivisor: 2 }, 100);
    expect(result).toEqual([0, 0]);
  });


  it('ratio and taxDivisor are not 0', () => {
    const result = resolveAmountAndTax({ ratio: 0.5, taxDivisor: 2 }, 100);
    expect(result).toEqual([50, 25]);
  });

  it('ratio and taxDivisor are not finite number', () => {
    const result = resolveAmountAndTax({ ratio: Number.NaN, taxDivisor: Number.NaN }, 100);
    expect(result).toEqual([0, 0]);
  });
})

describe("resolveAmountAndTax", () => {
  it('shares are empty', () => {
    const result = applyDiscountToMultipleShares([], 100);
    expect(result).toEqual([0, 0]);
  });

  it('shares have one share', () => {
    const shares = [{ ratio: 0.5, taxDivisor: 2 }];
    const result = applyDiscountToMultipleShares(shares, 100);
    expect(result).toEqual([50, 25]);
  });

  it('shares have multiple shares', () => {
    const shares = [
      { ratio: 0.5, taxDivisor: 2 },
      { ratio: 0.2, taxDivisor: 1.5 },
    ];
    const result = applyDiscountToMultipleShares(shares, 100);
    expect(result).toEqual([70, 31.666666666666664]);
  });
})

describe('applyRate', () => {
  it('applies the rate correctly when a rate is provided', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(10);
  });

  it('applies the fixed rate correctly when a fixed rate is provided', () => {
    const configuration = {
      fixedRate: 50
    };
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(50);
  });

  it('applies the fixed rate correctly when a fixed rate is provided and the amount is less than fixed rate', () => {
    const configuration = {
      fixedRate: 150
    };
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(100);
  });

  it('applies the rate correctly when rate is less than or equal to 0', () => {
    const configuration = {
      rate: -0.1
    };
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });
  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });


  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });


  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });



  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });


  it('returns 0 when rate and fixed rate are not provided', () => {
    const configuration = {};
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(0);
  });

  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });

  it('returns 0 when rate and fixed rate are not provided', () => {
    const configuration = {};
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(0);
  });


});


describe('calculateAmountToSplit', () => {
  it('calculates the correct amount to split when using a rate', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeducted: 0,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(100);
  });

  it('calculates the correct amount to split when using a fixed rate', () => {
    const configuration = {
      fixedRate: 50,
      alreadyDeducted: 0,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(50);
  });

  it('calculates the correct amount to split when alreadyDeducted is non-zero', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeducted: 10,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(90);
  });

  it('returns 0 when the amount to deduct is less than or equal to alreadyDeducted', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeducted: 100,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });

  it('returns 0 when the amount is less than or equal to 0', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeducted: 0,
    };
    const amount = 0;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });


  it('returns 0 when amount is negative', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeducted: 0,
    };
    const amount = -1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });

  it('returns 0 when configuration rate is negative', () => {
    const configuration = {
      rate: -0.1,
      alreadyDeducted: 0,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });


});