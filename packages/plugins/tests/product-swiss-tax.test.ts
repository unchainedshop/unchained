import {jest} from '@jest/globals'
import { SwissTaxCategories, getTaxRate, isDeliveryAddressInSwitzerland, ProductSwissTax } from '../src/pricing/product-swiss-tax';

describe('SwissTaxCategories', () => {
  it('DEFAULT rate', () => {
    expect(SwissTaxCategories.DEFAULT.rate()).toBe(0.077);
  });

  it('REDUCED rate', () => {
    expect(SwissTaxCategories.REDUCED.rate()).toBe(0.025);
  });

  it('SPECIAL rate', () => {
    expect(SwissTaxCategories.SPECIAL.rate()).toBe(0.037);
  });
});

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

describe('isDeliveryAddressInSwitzerland', () => {
  const context =  {
    modules:  {
      orders: {
        deliveries: {
          findDelivery: jest.fn(async({orderDeliveryId}) =>{ 
            if(orderDeliveryId === 'CH' || orderDeliveryId === 'LI' )
           return {context: { address: { countryCode: 'CH'}}}
           if(orderDeliveryId === null)
           return {context: { address: null}}
           return {context: { address: {countryCode: 'RT'}}}
          })
        }
      }
    },
    order : {
      deliveryId: 'CH',
      billingAddress: {countryCode: 'LI'}
    },
    country: 'CH'
  }
  it('Should return true when passed country code CH', async () => {
    expect(await isDeliveryAddressInSwitzerland({...context, country: 'ch', order: null})).toBe(true);
  });

  it('Should return true when passed country code LI', async () => {
    expect(await isDeliveryAddressInSwitzerland({...context, country: 'LI', order: null})).toBe(true);
  });

  it('Should return false when country is neither CH nor LI and order is null', async () => {
    expect(await isDeliveryAddressInSwitzerland({...context, country: 'ET', order: null})).toBe(false);
  });

  it('Order should take precedence over country parameter', async () => {
    // not CH or LI order so returns false
    expect(await isDeliveryAddressInSwitzerland({...context, country: 'CH', order : {
      deliveryId: 'ET',
      billingAddress: {countryCode: 'ET'}
    }})).toBe(false);
  });

  it('If order is not from CH and LI but billingAddress is, it should take precedence over country ', async () => {
    expect(await isDeliveryAddressInSwitzerland({...context, country: 'IT', order : {
      deliveryId: null,
      billingAddress: { countryCode: 'CH'}
    }})).toBe(true);
  });

  it('Should return false if billingAddress is neither CH or LI and order does not have address', async () => {
    expect(await isDeliveryAddressInSwitzerland({...context, country: null, order : {
      deliveryId: null,
      billingAddress: {countryCode: 'HH'}
    }})).toBe(false);
  });
});


describe('ProductSwissTax', () => {
  describe('actions', () => {
    let calculationSheet;
    let params;
    let context;
    

    beforeEach(() => {
      calculationSheet = {
        addTax: jest.fn(({amount}) => console.log('add tax called', amount)),
        filterBy: jest.fn().mockReturnValue([
          { isTaxable: true, amount: 100, isNetPrice: false },
          { isTaxable: true, amount: 200, isNetPrice: true },
        ]),
      };
      context = {
        product: {
          tags: ['swiss-tax-category:reduced']
        },
        order: {
          deliveryId: 'delivery-1',
        },
        currency: 'CH',
        quantity: 3,
        modules: {
          orders: {
            deliveries: {
              findDelivery: jest.fn().mockReturnValue({
                context: {
                  address: {
                    countryCode: 'CH',
                  },
                },
              }),
            },
          },
        },
      };
      params = {
        context,
        calculationSheet,
      };
    });

    it('should return the correct pricing adapter actions', () => {

      const actions = ProductSwissTax.actions(params);
      expect(actions).toHaveProperty('calculate');
      expect(actions).toHaveProperty('getCalculation');
      expect(actions).toHaveProperty('getContext');
      expect(actions).toHaveProperty('resultSheet');
    });
    

    it('should calculate Swiss tax for taxable rows when the delivery address is in Switzerland', async () => {
      context.modules.orders.deliveries.findDelivery.mockResolvedValue({
        context: {
          address: {
            countryCode: 'CH',
          },
        },
      });
      const actions = ProductSwissTax.actions(params);
      
      expect(await actions.calculate()).toEqual([
        {
          isTaxable: false,
          amount: -2.439024390243901,
          isNetPrice: false,
          meta: { adapter: 'shop.unchained.pricing.product-swiss-tax' }
        },
        {
          category: 'TAX',
          amount: 2.439024390243901,
          isTaxable: false,
          isNetPrice: false,
          rate: 0.025,
          meta: { adapter: 'shop.unchained.pricing.product-swiss-tax' }
        },
        {
          category: 'TAX',
          amount: 5,
          isTaxable: false,
          isNetPrice: false,
          rate: 0.025,
          meta: { adapter: 'shop.unchained.pricing.product-swiss-tax' }
        }
      ])
      
    });

    it('should not calculate Swiss tax for taxable rows when the delivery address is not in Switzerland', async () => {
      context.modules.orders.deliveries.findDelivery.mockResolvedValue({
        context: {
          address: {
            countryCode: 'US',
          },
        },
      });
      const actions = ProductSwissTax.actions(params);
      expect(await actions.calculate()).toEqual([]);
    });
  });

})

