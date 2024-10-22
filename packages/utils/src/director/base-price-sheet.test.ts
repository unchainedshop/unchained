import { BasePricingSheet } from './BasePricingSheet.js';

describe('BasePricingSheet', () => {
  let pricingSheet;
  const TAX = { category: 'tax', amount: 100 };
  const DISCOUNT = { category: 'discount', amount: 50 };
  const ITEM1 = { category: 'item', amount: 200 };
  const ITEM2 = { category: 'item', amount: 200 };
  const calculations = [TAX, DISCOUNT, ITEM1, ITEM2];

  beforeEach(() => {
    pricingSheet = BasePricingSheet({
      calculation: calculations,
    });
  });

  it('gross() calculates the sum of the amounts in the calculations', () => {
    expect(pricingSheet.gross()).toEqual(550);
  });

  it('gross() returns 0 if the calculation is empty', () => {
    expect(BasePricingSheet({ calculation: [] }).gross()).toEqual(0);
  });

  it('total() calculates the sum of the amounts in the calculations by default', () => {
    expect(pricingSheet.total()).toEqual({ amount: 550, currency: undefined });
  });

  it('total() calculates the sum of the amounts in the calculations for a given category', () => {
    expect(pricingSheet.total({ category: 'item' })).toEqual({ amount: 400, currency: undefined });
  });

  it('total() calculates the net sum of the amounts in the calculations if useNetPrice is true', () => {
    expect(pricingSheet.total({ useNetPrice: true })).toEqual({ amount: 550, currency: undefined });
  });

  it('total() returns 0 if the calculation is empty', () => {
    expect(BasePricingSheet({ calculation: [] }).total()).toEqual({ amount: 0, currency: undefined });
  });

  it('calculates the correct net amount', () => {
    expect(pricingSheet.net()).toEqual(550);
  });

  it('calculates the correct sum for a given category', () => {
    expect(pricingSheet.sum({ category: 'item' })).toEqual(400);
  });

  it('calculates the correct tax amount', () => {
    expect(pricingSheet.taxSum()).toEqual(0);
  });

  describe('getRawPricingSheet', () => {
    it('returns the correct list of calculations', () => {
      expect(pricingSheet.getRawPricingSheet()).toEqual(calculations);
    });

    it('returns an empty list of calculations if none are provided', () => {
      expect(BasePricingSheet({}).getRawPricingSheet()).toEqual([]);
    });
  });

  describe('isValid', () => {
    it('returns true if the sheet has calculations', () => {
      expect(pricingSheet.isValid()).toEqual(true);
    });

    it('returns false if the sheet does not have calculations', () => {
      expect(BasePricingSheet({}).isValid()).toEqual(false);
    });
  });

  describe('filterBy', () => {
    it('filters the list of calculations correctly', () => {
      expect(pricingSheet.filterBy({ category: 'item' })).toEqual([ITEM1, ITEM2]);
    });

    it('returns the full list of calculations if no filter is provided', () => {
      expect(pricingSheet.filterBy()).toEqual(calculations);
    });
  });

  describe('resetCalculation', () => {
    it('resets the list of calculations correctly', () => {
      const expectedCalculations = calculations.reduce(
        (prev, { amount, ...row }) => {
          return [
            ...prev,
            {
              ...row,
              amount: -amount,
            },
          ];
        },
        [...calculations],
      );
      expect(pricingSheet.resetCalculation(pricingSheet)).toEqual(expectedCalculations);
    });
  });
});
