import { applyDiscountToMultipleShares, calculateAmountToSplit, resolveAmountAndTax, resolveRatioAndTaxDivisorForPricingSheet } from "./order-discount.js";



describe("OrderDiscount helpers ", () => {
describe("resolveRatioAndTaxDivisorForPricingSheet", () => {
  it('total is 0 and pricing is not provided', () => {
    const result = resolveRatioAndTaxDivisorForPricingSheet(null, 0);
    expect(result).toEqual({ ratio: 1, taxDivisor: 1 });
  });
  it('total is not 0 and pricing is not provided', () => {
    const result = resolveRatioAndTaxDivisorForPricingSheet(null, 10);
    expect(result).toEqual({ ratio: 1, taxDivisor: 1 });
  });
  it('total is 0 and pricing is provided', () => {
    const pricing = {
      taxSum: () => 10,
      gross: () => 20,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 0);
    expect(result).toEqual({ ratio: 1, taxDivisor: 1 });
  });

  it('gross - tax is 0', () => {
    const pricing = {
      taxSum: () => 10,
      gross: () => 10,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 20);
    expect(result).toEqual({ ratio: 0, taxDivisor: 0 });
  });

  it('gross - tax is not 0', () => {
    const pricing = {
      taxSum: () => 10,
      gross: () => 20,
    };
    const result = resolveRatioAndTaxDivisorForPricingSheet(pricing, 20);
    expect(result).toEqual({ ratio: 1, taxDivisor: 2 });
  });

  it('taxSum is 0', () => {
    const pricing = {
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

describe('calculateAmountToSplit', () => {
  it('calculates the correct amount to split when using a rate', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeductedForDiscount: 0,
      amountLeft: 100,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(100);
  });

  it('calculates the correct amount to split when using a fixed rate', () => {
    const configuration = {
      fixedRate: 50,
      alreadyDeductedForDiscount: 0,
      amountLeft: 100,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(50);
  });

  it('calculates the correct amount to split when alreadyDeductedForDiscount is non-zero', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeductedForDiscount: 10,
      amountLeft: 100,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(90);
  });


  it('calculates the correct amount to split when amountLeft is less than the amount to deduct', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeductedForDiscount: 0,
      amountLeft: 50,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(50);
  });

  it('returns 0 when the amount to deduct is less than or equal to alreadyDeductedForDiscount', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeductedForDiscount: 100,
      amountLeft: 100,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });

  it('returns 0 when the amount is less than or equal to 0', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeductedForDiscount: 0,
      amountLeft: 100,
    };
    const amount = 0;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });

  it('returns 0 when amountLeft is 0', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeductedForDiscount: 0,
      amountLeft: 0,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });

  it('returns 0 when amount is negative', () => {
    const configuration = {
      rate: 0.1,
      alreadyDeductedForDiscount: 0,
      amountLeft: 100,
    };
    const amount = -1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });

  it('returns 0 when configuration rate is negative', () => {
    const configuration = {
      rate: -0.1,
      alreadyDeductedForDiscount: 0,
      amountLeft: 100,
    };
    const amount = 1000;
    expect(calculateAmountToSplit(configuration, amount)).toBe(0);
  });


});


})