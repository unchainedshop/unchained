import {configureProductPriceRounding, ProductPriceRoundSettings, roundToNext} from '../src/pricing/product-price-round'

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

describe('configureProductPriceRounding', () => {
  beforeEach(() => {
    ProductPriceRoundSettings.configurations = {};
    ProductPriceRoundSettings.defaultPrecision = 50;
    ProductPriceRoundSettings.skip = [];
  });

  it('updates the default precision correctly', () => {
    configureProductPriceRounding({ defaultPrecision: 100 });
    expect(ProductPriceRoundSettings.defaultPrecision).toBe(100);
  });

  it('updates the configurations correctly', () => {
    configureProductPriceRounding({ configurations: { 'product1': 25 } });
    expect(ProductPriceRoundSettings.configurations).toEqual({ 'product1': 25 });
  });

  it('updates the skip list correctly', () => {
    configureProductPriceRounding({ skip: ['product1'] });
    expect(ProductPriceRoundSettings.skip).toEqual(['product1']);
  });

  it('updates multiple properties correctly', () => {
    configureProductPriceRounding({
      configurations: { 'product1': 25 },
      defaultPrecision: 100,
      skip: ['product1']
    });
    expect(ProductPriceRoundSettings.configurations).toEqual({ 'product1': 25 });
    expect(ProductPriceRoundSettings.defaultPrecision).toBe(100);
    expect(ProductPriceRoundSettings.skip).toEqual(['product1']);
  });

  it('does not update any properties when no arguments are passed', () => {
    configureProductPriceRounding({});
    expect(ProductPriceRoundSettings.configurations).toEqual({});
    expect(ProductPriceRoundSettings.defaultPrecision).toBe(50);
    expect(ProductPriceRoundSettings.skip).toEqual([]);
  });
});


});
