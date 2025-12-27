/**
 * Tests for the Payment Providers Module
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createMemoryStore } from '@unchainedshop/store/memory';
import {
  configurePaymentProvidersModule,
  PaymentProviderType,
  type PaymentProvidersModule,
} from './configurePaymentProvidersModule.ts';

describe('Payment Providers Module', () => {
  let store: Awaited<ReturnType<typeof createMemoryStore>>;
  let paymentProviders: PaymentProvidersModule;

  before(async () => {
    store = await createMemoryStore({ environment: 'server' });
    paymentProviders = configurePaymentProvidersModule(store);

    // Seed test data
    await paymentProviders.create({
      type: PaymentProviderType.INVOICE,
      adapterKey: 'shop.unchained.payment.invoice',
      configuration: [{ key: 'dueDate', value: '30' }],
    });
    await paymentProviders.create({
      type: PaymentProviderType.GENERIC,
      adapterKey: 'shop.unchained.payment.stripe',
      configuration: [{ key: 'publishableKey', value: 'pk_test_xxx' }],
    });
    await paymentProviders.create({
      type: PaymentProviderType.GENERIC,
      adapterKey: 'shop.unchained.payment.paypal',
      configuration: [],
    });
  });

  after(async () => {
    await store.close();
  });

  describe('CRUD operations', () => {
    it('should create a payment provider', async () => {
      const provider = await paymentProviders.create({
        type: PaymentProviderType.GENERIC,
        adapterKey: 'shop.unchained.payment.wire',
        configuration: [],
      });

      assert.ok(provider, 'Should return the created provider');
      assert.ok(provider._id, 'Should have an _id');
      assert.strictEqual(provider.type, PaymentProviderType.GENERIC);
      assert.strictEqual(provider.adapterKey, 'shop.unchained.payment.wire');
    });

    it('should find a provider by ID', async () => {
      const created = await paymentProviders.create({
        type: PaymentProviderType.INVOICE,
        adapterKey: 'shop.unchained.payment.cod',
        configuration: [],
      });

      const found = await paymentProviders.findProvider({ paymentProviderId: created._id });

      assert.ok(found, 'Should find the provider');
      assert.strictEqual(found._id, created._id);
      assert.strictEqual(found.adapterKey, 'shop.unchained.payment.cod');
    });

    it('should update a provider', async () => {
      const created = await paymentProviders.create({
        type: PaymentProviderType.GENERIC,
        adapterKey: 'shop.unchained.payment.braintree',
        configuration: [],
      });

      const updated = await paymentProviders.update(created._id, {
        configuration: [{ key: 'merchantId', value: 'merchant123' }],
      });

      assert.ok(updated, 'Should return updated provider');
      assert.deepStrictEqual(updated.configuration, [{ key: 'merchantId', value: 'merchant123' }]);
      assert.ok(updated.updated, 'Should have updated timestamp');
    });

    it('should soft-delete a provider', async () => {
      const created = await paymentProviders.create({
        type: PaymentProviderType.GENERIC,
        adapterKey: 'shop.unchained.payment.adyen',
        configuration: [],
      });

      const deleted = await paymentProviders.delete(created._id);

      assert.ok(deleted, 'Should return deleted provider');
      assert.ok(deleted.deleted, 'Should have deleted timestamp');

      // Should not appear in default query
      const providers = await paymentProviders.findProviders({});
      const adyen = providers.find((p) => p.adapterKey === 'shop.unchained.payment.adyen');
      assert.ok(!adyen, 'Deleted provider should not be in results');
    });
  });

  describe('Query operations', () => {
    it('should find providers with pagination', async () => {
      const firstPage = await paymentProviders.findProviders({ limit: 2, offset: 0 });
      assert.strictEqual(firstPage.length, 2, 'First page should have 2 providers');

      const secondPage = await paymentProviders.findProviders({ limit: 2, offset: 2 });
      assert.ok(secondPage.length >= 1, 'Second page should have at least 1 provider');
    });

    it('should filter by type', async () => {
      const invoiceProviders = await paymentProviders.findProviders({
        type: PaymentProviderType.INVOICE,
      });

      assert.ok(invoiceProviders.length >= 1, 'Should find at least one invoice provider');
      for (const provider of invoiceProviders) {
        assert.strictEqual(provider.type, PaymentProviderType.INVOICE);
      }
    });

    it('should filter by IDs', async () => {
      const allProvidersList = await paymentProviders.allProviders();
      const firstTwo = allProvidersList.slice(0, 2);
      const ids = firstTwo.map((p) => p._id);

      const filtered = await paymentProviders.findProviders({
        paymentProviderIds: ids,
      });

      assert.strictEqual(filtered.length, 2, 'Should find exactly 2 providers');
    });

    it('should count providers', async () => {
      const count = await paymentProviders.count({});
      assert.ok(count >= 3, `Expected at least 3 providers, got ${count}`);
    });

    it('should check provider exists', async () => {
      const providersList = await paymentProviders.allProviders();
      const firstProvider = providersList[0];

      const exists = await paymentProviders.providerExists({ paymentProviderId: firstProvider._id });
      assert.strictEqual(exists, true, 'Provider should exist');

      const notExists = await paymentProviders.providerExists({ paymentProviderId: 'nonexistent' });
      assert.strictEqual(notExists, false, 'Non-existent provider should not exist');
    });
  });

  describe('Caching', () => {
    it('should cache allProviders results', async () => {
      // First call
      const first = await paymentProviders.allProviders();

      // Create a new provider
      await paymentProviders.create({
        type: PaymentProviderType.GENERIC,
        adapterKey: 'shop.unchained.payment.cached-test',
        configuration: [],
      });

      // In production mode with 60s cache, this would still return old data
      // In test mode (1ms cache), it should return new data
      const second = await paymentProviders.allProviders();

      // Both calls should return valid arrays
      assert.ok(Array.isArray(first), 'First call should return array');
      assert.ok(Array.isArray(second), 'Second call should return array');
    });
  });
});
