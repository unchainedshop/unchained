import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
  pluginRegistry,
  type IDeliveryPricingAdapter,
} from '@unchainedshop/core';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Order } from '@unchainedshop/core-orders';
import { DeliverySwissTax } from './delivery-swiss-tax/adapter.ts';
import { DeliveryEuTax } from './delivery-eu-tax/adapter.ts';
import { DeliveryUkTax } from './delivery-uk-tax/adapter.ts';
import { DeliveryUsSalesTax } from './delivery-us-sales-tax/adapter.ts';

// CHF 10.00 net delivery fee
const NetFee: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,
  key: 'shop.unchained.tests.pricing.net-delivery-fee',
  label: 'Net delivery fee',
  version: '1.0.0',
  orderIndex: 0,
  isActivatedFor: () => true,
  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    return {
      ...pricingAdapter,
      calculate: async () => {
        pricingAdapter.resultSheet().addFee({ amount: 1000, isTaxable: true, isNetPrice: true });
        return pricingAdapter.calculate();
      },
    };
  },
};

const provider = { _id: 'post', configuration: [] } as unknown as DeliveryProvider;

// The simulation path (DeliveryProvider.simulatedPrice) prices a provider without an
// order delivery: with or without a cart, the delivery fee must still be taxed.
const simulate = async (countryCode: string, order?: Partial<Order>) => {
  const context = {
    countryCode,
    currencyCode: 'CHF',
    provider,
    order: order as Order | undefined,
    user: undefined as any,
  };
  const calculation = await DeliveryPricingDirector.rebuildCalculation(context, {
    modules: {} as any,
  });
  return DeliveryPricingDirector.calculationSheet(context, calculation);
};

describe('delivery tax adapters in a delivery price simulation', () => {
  afterEach(() => {
    pluginRegistry.clear();
  });

  for (const [Adapter, countryCode] of [
    [DeliverySwissTax, 'CH'],
    [DeliveryEuTax, 'DE'],
    [DeliveryUkTax, 'GB'],
    [DeliveryUsSalesTax, 'US'],
  ] as const) {
    it(`${Adapter.key} activates without an order delivery`, () => {
      assert.equal(
        Adapter.isActivatedFor({ countryCode, provider, discounts: [] } as any),
        true,
        'without a cart',
      );
      assert.equal(
        Adapter.isActivatedFor({
          countryCode,
          provider,
          discounts: [],
          order: { countryCode } as Order,
        } as any),
        true,
        'with a cart',
      );
    });
  }

  it('taxes the simulated Swiss delivery fee', async () => {
    pluginRegistry.register({
      key: 'shop.unchained.tests.delivery-tax-simulation',
      label: 'Delivery tax simulation',
      version: '1.0.0',
      adapters: [NetFee, DeliverySwissTax],
    });

    const withoutCart = await simulate('CH');
    assert.equal(withoutCart.total().amount, 1081);
    assert.equal(withoutCart.total({ useNetPrice: true }).amount, 1000);

    const withCart = await simulate('CH', { countryCode: 'CH', billingAddress: { countryCode: 'CH' } });
    assert.equal(withCart.total().amount, 1081);
  });
});
