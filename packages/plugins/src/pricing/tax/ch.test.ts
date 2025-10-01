import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SwissTaxCategories, isDeliveryAddressInSwitzerland } from './ch';

describe('SwissTaxCategories', () => {
  it('DEFAULT rate', () => {
    assert.strictEqual(SwissTaxCategories.DEFAULT.rate(new Date(2023, 1, 1)), 0.077);
    assert.strictEqual(SwissTaxCategories.DEFAULT.rate(new Date(2024, 1, 1)), 0.081);
  });

  it('REDUCED rate', () => {
    assert.strictEqual(SwissTaxCategories.REDUCED.rate(new Date(2023, 1, 1)), 0.025);
    assert.strictEqual(SwissTaxCategories.REDUCED.rate(new Date(2024, 1, 1)), 0.026);
  });

  it('SPECIAL rate', () => {
    assert.strictEqual(SwissTaxCategories.SPECIAL.rate(new Date(2023, 1, 1)), 0.037);
    assert.strictEqual(SwissTaxCategories.SPECIAL.rate(new Date(2024, 1, 1)), 0.038);
  });
});

describe('isDeliveryAddressInSwitzerland', () => {
  const context = {
    modules: {
      orders: {
        deliveries: {
          findDelivery: async ({ orderDeliveryId }: any) => {
            if (orderDeliveryId === 'CH' || orderDeliveryId === 'LI')
              return { context: { address: { countryCode: 'CH' } } };
            if (orderDeliveryId === null) return { context: { address: null } };
            return { context: { address: { countryCode: 'RT' } } };
          },
        },
      },
    },
    order: {
      deliveryId: 'CH',
      billingAddress: { countryCode: 'LI' },
    },
    countryCode: 'CH',
  };
  it('Should return true when passed country code CH', async () => {
    assert.strictEqual(
      await isDeliveryAddressInSwitzerland({ ...context, countryCode: 'ch', order: null } as any),
      true,
    );
  });

  it('Should return true when passed country code LI', async () => {
    assert.strictEqual(
      await isDeliveryAddressInSwitzerland({ ...context, countryCode: 'LI', order: null } as any),
      true,
    );
  });

  it('Should return false when country is neither CH nor LI and order is null', async () => {
    assert.strictEqual(
      await isDeliveryAddressInSwitzerland({ ...context, countryCode: 'ET', order: null } as any),
      false,
    );
  });

  it('Order should take precedence over country parameter', async () => {
    // not CH or LI order so returns false
    assert.strictEqual(
      await isDeliveryAddressInSwitzerland({
        ...context,
        countryCode: 'CH',
        order: {
          deliveryId: 'ET',
          billingAddress: { countryCode: 'ET' },
        },
      } as any),
      false,
    );
  });

  it('If order is not from CH and LI but billingAddress is, it should take precedence over country ', async () => {
    assert.strictEqual(
      await isDeliveryAddressInSwitzerland({
        ...context,
        countryCode: 'IT',
        order: {
          deliveryId: null,
          billingAddress: { countryCode: 'CH' },
        },
      } as any),
      true,
    );
  });

  it('Should return false if billingAddress is neither CH or LI and order does not have address', async () => {
    assert.strictEqual(
      await isDeliveryAddressInSwitzerland({
        ...context,
        country: null,
        order: {
          deliveryId: null,
          billingAddress: { countryCode: 'HH' },
        },
      } as any),
      false,
    );
  });
});
