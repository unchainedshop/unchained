import { ProductPrice } from '../src/pricing/product-catalog-price';
import {jest} from '@jest/globals'
import { DeliveryPricingAdapterContext } from '@unchainedshop/types/delivery.pricing';
import { SwissTaxCategories, getTaxRate, isDeliveryAddressInSwitzerland } from '../src/pricing/product-swiss-tax';

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
            if(orderDeliveryId === 'CH' )
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

  it('Order country should take precedence over country parameter', async () => {
    expect(await isDeliveryAddressInSwitzerland({...context, country: 'CH', order : {
      deliveryId: 'ET',
      billingAddress: {countryCode: 'ET'}
    }})).toBe(false);
  });

  it('Should return true if billingAddress is either CH or LI and order does not have address', async () => {
    expect(await isDeliveryAddressInSwitzerland({...context, country: 'CH', order : {
      deliveryId: null,
      billingAddress: { countryCode: 'CH'}
    }})).toBe(true);
  });

  it('Should return false if billingAddress is either CH or LI and order does not have address', async () => {
    expect(await isDeliveryAddressInSwitzerland({...context, country: null, order : {
      deliveryId: null,
      billingAddress: {countryCode: 'HH'}
    }})).toBe(false);
  });

  it('REDUCED rate', async () => {
    expect(await isDeliveryAddressInSwitzerland(context)).toBe(true);
  });

  it('SPECIAL rate',async () => {
    expect(await isDeliveryAddressInSwitzerland(context)).toBe(true);
  });
});