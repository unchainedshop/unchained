import { getTaxRate, isDeliveryAddressInSwitzerland } from './product-swiss-tax.js';

describe('ProductSwissTax', () => {
  describe('getTaxRate', () => {
    it('default rate', () => {
      expect(
        getTaxRate({
          product: {} as any,
          order: {} as any,
        } as any),
      ).toBe(0.081);
    });

    it('reduced rate', () => {
      expect(
        getTaxRate({
          product: {
            tags: ['swiss-tax-category:reduced'],
          },
          order: {},
        } as any),
      ).toBe(0.026);
    });

    it('special rate', () => {
      expect(
        getTaxRate({
          product: {
            tags: ['swiss-tax-category:special'],
          },
          order: {},
        } as any),
      ).toBe(0.038);
    });

    it('default rate', () => {
      expect(
        getTaxRate({
          product: {
            tags: ['swiss-tax-category:default'],
          },
          order: {},
        } as any),
      ).toBe(0.081);
    });
  });

  describe('isDeliveryAddressInSwitzerland', () => {
    const context = {
      modules: {
        orders: {
          deliveries: {
            findDelivery: import.meta.jest.fn(async ({ orderDeliveryId }) => {
              if (orderDeliveryId === 'CH' || orderDeliveryId === 'LI')
                return { context: { address: { countryCode: 'CH' } } };
              if (orderDeliveryId === null) return { context: { address: null } };
              return { context: { address: { countryCode: 'RT' } } };
            }),
          },
        },
      },
      order: {
        deliveryId: 'CH',
        billingAddress: { countryCode: 'LI' },
      },
      country: 'CH',
    };
    it('Should return true when passed country code CH', async () => {
      expect(
        await isDeliveryAddressInSwitzerland({ ...context, country: 'ch', order: null } as any),
      ).toBe(true);
    });

    it('Should return true when passed country code LI', async () => {
      expect(
        await isDeliveryAddressInSwitzerland({ ...context, country: 'LI', order: null } as any),
      ).toBe(true);
    });

    it('Should return false when country is neither CH nor LI and order is null', async () => {
      expect(
        await isDeliveryAddressInSwitzerland({ ...context, country: 'ET', order: null } as any),
      ).toBe(false);
    });

    it('Order should take precedence over country parameter', async () => {
      // not CH or LI order so returns false
      expect(
        await isDeliveryAddressInSwitzerland({
          ...context,
          country: 'CH',
          order: {
            deliveryId: 'ET',
            billingAddress: { countryCode: 'ET' },
          },
        } as any),
      ).toBe(false);
    });

    it('If order is not from CH and LI but billingAddress is, it should take precedence over country ', async () => {
      expect(
        await isDeliveryAddressInSwitzerland({
          ...context,
          country: 'IT',
          order: {
            deliveryId: null,
            billingAddress: { countryCode: 'CH' },
          },
        } as any),
      ).toBe(true);
    });

    it('Should return false if billingAddress is neither CH or LI and order does not have address', async () => {
      expect(
        await isDeliveryAddressInSwitzerland({
          ...context,
          country: null,
          order: {
            deliveryId: null,
            billingAddress: { countryCode: 'HH' },
          },
        } as any),
      ).toBe(false);
    });
  });
});
