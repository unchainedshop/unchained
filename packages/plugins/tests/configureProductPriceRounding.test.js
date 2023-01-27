import {configureProductPriceRounding, ProductPriceRoundSettings } from '../src/pricing/product-price-round'



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