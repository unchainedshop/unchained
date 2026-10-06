import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import {
  PaymentPricingAdapter,
  PaymentPricingDirector,
  pluginRegistry,
  type IPaymentPricingAdapter,
} from '@unchainedshop/core';
import type { PaymentProvider } from '@unchainedshop/core-payment';
import type { Order } from '@unchainedshop/core-orders';
import { PaymentUkTax } from './adapter.ts';

const Fee = (amount: number, isNetPrice: boolean): IPaymentPricingAdapter => ({
  ...PaymentPricingAdapter,
  key: 'shop.unchained.tests.pricing.payment-fee',
  label: 'Payment fee',
  version: '1.0.0',
  orderIndex: 0,
  isActivatedFor: () => true,
  actions: (params) => {
    const pricingAdapter = PaymentPricingAdapter.actions(params);
    return {
      ...pricingAdapter,
      calculate: async () => {
        pricingAdapter.resultSheet().addFee({ amount, isTaxable: true, isNetPrice });
        return pricingAdapter.calculate();
      },
    };
  },
});

const provider = (configuration = []) =>
  ({ _id: 'invoice', configuration }) as unknown as PaymentProvider;

const price = async ({
  fee,
  countryCode = 'CH',
  order,
  configuration,
  deliveryAddressCountryCode,
}: {
  fee: IPaymentPricingAdapter;
  countryCode?: string;
  order?: Partial<Order>;
  configuration?: { key: string; value: string }[];
  deliveryAddressCountryCode?: string;
}) => {
  pluginRegistry.register({
    key: 'shop.unchained.tests.payment-uk-tax',
    label: 'Payment UK tax',
    version: '1.0.0',
    adapters: [fee, PaymentUkTax],
  });
  const context = {
    countryCode,
    currencyCode: 'CHF',
    provider: provider(configuration),
    order: order as Order | undefined,
    user: undefined as any,
  };
  const modules = {
    orders: {
      deliveries: {
        findDelivery: async () => ({
          context: { address: { countryCode: deliveryAddressCountryCode } },
        }),
      },
    },
  } as any;
  const calculation = await PaymentPricingDirector.rebuildCalculation(context, { modules });
  const sheet = PaymentPricingDirector.calculationSheet(context, calculation);
  return {
    gross: sheet.total().amount,
    net: sheet.total({ useNetPrice: true }).amount,
  };
};

describe('PaymentUkTax', () => {
  // Start from an empty registry, then hand back the plugins of a platform in the same process
  let restorePlugins: () => void;
  before(() => {
    restorePlugins = pluginRegistry.clear();
  });
  afterEach(() => {
    pluginRegistry.clear();
  });
  after(() => {
    restorePlugins();
  });

  it('extracts 20% VAT from a gross payment fee', async () => {
    assert.deepEqual(await price({ fee: Fee(150, false), countryCode: 'GB' }), { gross: 150, net: 125 });
  });

  it('adds 20% VAT to a net payment fee', async () => {
    assert.deepEqual(await price({ fee: Fee(1000, true), countryCode: 'GB' }), {
      gross: 1200,
      net: 1000,
    });
  });

  it('applies the uk-tax-category of the payment provider', async () => {
    assert.deepEqual(
      await price({
        fee: Fee(1000, true),
        countryCode: 'GB',
        configuration: [{ key: 'uk-tax-category', value: 'reduced' }],
      }),
      { gross: 1050, net: 1000 },
    );
    assert.deepEqual(
      await price({
        fee: Fee(1000, true),
        countryCode: 'GB',
        configuration: [{ key: 'uk-tax-category', value: 'zero' }],
      }),
      { gross: 1000, net: 1000 },
    );
  });

  it('does not tax a payment fee outside of the UK VAT area', async () => {
    assert.deepEqual(await price({ fee: Fee(1000, true), countryCode: 'DE' }), {
      gross: 1000,
      net: 1000,
    });
  });

  it('follows the delivery address of the order, like the goods', async () => {
    assert.deepEqual(
      await price({
        fee: Fee(1000, true),
        countryCode: 'GB',
        order: { countryCode: 'GB', deliveryId: 'delivery', billingAddress: { countryCode: 'GB' } },
        deliveryAddressCountryCode: 'FR',
      }),
      { gross: 1000, net: 1000 },
    );
  });
});
