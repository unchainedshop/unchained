import { SwissTaxCategories, getTaxRate } from '../src/pricing/product-swiss-tax';



describe('getTaxRate', () => {
  it('default rate', () => {
    const context: any = {
      product: {
        tags: []
      },
      provider: {
        configuration: [],
      },
    };
    expect(getTaxRate(context)).toBe(0.077);
  });

  it('reduced rate', () => {
    const context: any = {
      product: {
        tags: ['swiss-tax-category:reduced']
      },
      provider: {
        configuration: [
          {
            key: 'swiss-tax-category',
            value: SwissTaxCategories.REDUCED.rate(),
          },
        ],
      },
    };
    expect(getTaxRate(context)).toBe(0.025);
  });

  it('special rate', () => {
    const context: any = {
      product: {
        tags: ['swiss-tax-category:special']
      },
      provider: {
        configuration: [
          {
            key: 'swiss-tax-category',
            value: SwissTaxCategories.SPECIAL.rate(),
          },
        ],
      },
    };
    expect(getTaxRate(context)).toBe(0.037);
  });

  it('default rate', () => {
    const context: any = {
      product: {
        tags: ['swiss-tax-category:default']
      },
      provider: {
        configuration: [
          {
            key: 'swiss-tax-category',
            value: SwissTaxCategories.DEFAULT.rate(),
          },
        ],
      },
    };
    expect(getTaxRate(context)).toBe(0.077);
  });

})