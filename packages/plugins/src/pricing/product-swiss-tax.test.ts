import { getTaxRate, isDeliveryAddressInSwitzerland } from './product-swiss-tax.js';

describe("ProductSwissTax", () => {


describe('getTaxRate', () => {
  it('default rate', () => {
    expect(getTaxRate({
      product: {} as any,
      order: {} as any,
    })).toBe(0.077);
  });

  it('reduced rate', () => {
    expect(getTaxRate({
      product: {
        tags: ['swiss-tax-category:reduced']
      } as any,
      order: {} as any,
    })).toBe(0.025);
  });

  it('special rate', () => {
    expect(getTaxRate({
      product: {
        tags: ['swiss-tax-category:special']
      } as any,
      order: {} as any,
    })).toBe(0.037);
  });

  it('default rate', () => {
    expect(getTaxRate({
      product: {
        tags: ['swiss-tax-category:default']
      } as any,
      order: {} as any,
    })).toBe(0.077);
  });

})

describe('isDeliveryAddressInSwitzerland', () => {
  const context =  {
    modules:  {
      orders: {
        deliveries: {
          findDelivery: import.meta.jest.fn(async({orderDeliveryId}) =>{ 
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


})
