import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { paymentSettings, type PaymentProvider } from '@unchainedshop/core-payment';
import { deliverySettings, type DeliveryProvider } from '@unchainedshop/core-delivery';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
import { PaymentAdapter } from '../directors/PaymentAdapter.ts';
import { DeliveryAdapter } from '../directors/DeliveryAdapter.ts';
import { supportedPaymentProvidersService } from './supportedPaymentProviders.ts';
import { supportedDeliveryProvidersService } from './supportedDeliveryProviders.ts';
import type { Modules } from '../modules.ts';

// Providers are filtered per buyer with an async filterSupportedProviders, isActive stays sync
describe('supported providers', () => {
  const order = { _id: 'order', userId: 'approved-buyer' };
  const filterForApprovedBuyer = async ({ providers, order: { userId } }) => {
    await new Promise((resolve) => setImmediate(resolve));
    return providers.filter(({ _id }) => _id !== 'invoice' || userId === 'approved-buyer');
  };

  afterEach(() => {
    pluginRegistry.clear();
    paymentSettings.configureSettings();
    deliverySettings.configureSettings();
  });

  it('payment providers are filtered by an async filterSupportedProviders', async () => {
    pluginRegistry.register({
      key: 'shop.unchained.tests.payment',
      label: 'Payment',
      version: '1.0.0',
      adapters: [
        {
          ...PaymentAdapter,
          key: 'shop.unchained.tests.payment',
          label: 'Payment',
          version: '1.0.0',
          actions: (config, context) => ({
            ...PaymentAdapter.actions(config, context),
            isActive: () => true,
          }),
        },
      ],
    });
    paymentSettings.configureSettings({ filterSupportedProviders: filterForApprovedBuyer });
    const providers = ['invoice', 'card'].map(
      (_id) =>
        ({ _id, adapterKey: 'shop.unchained.tests.payment', configuration: [] }) as PaymentProvider,
    );
    const modules = {
      payment: { paymentProviders: { allProviders: async () => providers } },
    } as unknown as Modules;

    const approved = await supportedPaymentProvidersService.call(modules, { order } as any);
    assert.deepEqual(
      approved.map(({ _id }) => _id),
      ['invoice', 'card'],
    );
    const other = await supportedPaymentProvidersService.call(modules, {
      order: { ...order, userId: 'other-buyer' },
    } as any);
    assert.deepEqual(
      other.map(({ _id }) => _id),
      ['card'],
    );
  });

  it('delivery providers are filtered by an async filterSupportedProviders', async () => {
    pluginRegistry.register({
      key: 'shop.unchained.tests.delivery',
      label: 'Delivery',
      version: '1.0.0',
      adapters: [
        {
          ...DeliveryAdapter,
          key: 'shop.unchained.tests.delivery',
          label: 'Delivery',
          version: '1.0.0',
          actions: (config, context) => ({
            ...DeliveryAdapter.actions(config, context),
            isActive: () => true,
          }),
        },
      ],
    });
    deliverySettings.configureSettings({ filterSupportedProviders: filterForApprovedBuyer });
    const providers = ['invoice', 'post'].map(
      (_id) =>
        ({ _id, adapterKey: 'shop.unchained.tests.delivery', configuration: [] }) as DeliveryProvider,
    );
    const modules = { delivery: { allProviders: async () => providers } } as unknown as Modules;

    const other = await supportedDeliveryProvidersService.call(modules, {
      order: { ...order, userId: 'other-buyer' },
    } as any);
    assert.deepEqual(
      other.map(({ _id }) => _id),
      ['post'],
    );
  });
});
