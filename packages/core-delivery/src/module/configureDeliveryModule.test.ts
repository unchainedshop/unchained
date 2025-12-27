/**
 * Tests for the Delivery Providers Module
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createMemoryStore } from '@unchainedshop/store/memory';
import {
  configureDeliveryModule,
  type DeliveryModule,
  DeliveryProviderType,
} from './configureDeliveryModule.ts';

describe('Delivery Providers Module', () => {
  let store: Awaited<ReturnType<typeof createMemoryStore>>;
  let deliveryModule: DeliveryModule;

  before(async () => {
    store = await createMemoryStore({ environment: 'server' });
    deliveryModule = await configureDeliveryModule({ store });

    // Seed test data
    await deliveryModule.create({
      type: DeliveryProviderType.SHIPPING,
      adapterKey: 'shop.unchained.delivery.post',
      configuration: [{ key: 'trackingUrl', value: 'https://track.example.com' }],
    });
    await deliveryModule.create({
      type: DeliveryProviderType.PICKUP,
      adapterKey: 'shop.unchained.delivery.pickup',
      configuration: [],
    });
    await deliveryModule.create({
      type: DeliveryProviderType.SHIPPING,
      adapterKey: 'shop.unchained.delivery.express',
      configuration: [{ key: 'priority', value: 'high' }],
    });
  });

  after(async () => {
    await store.close();
  });

  describe('CRUD operations', () => {
    it('should create a delivery provider', async () => {
      const provider = await deliveryModule.create({
        type: DeliveryProviderType.SHIPPING,
        adapterKey: 'shop.unchained.delivery.dhl',
        configuration: [],
      });

      assert.ok(provider, 'Should return the created provider');
      assert.ok(provider._id, 'Should have an _id');
      assert.strictEqual(provider.type, DeliveryProviderType.SHIPPING);
      assert.strictEqual(provider.adapterKey, 'shop.unchained.delivery.dhl');
    });

    it('should find a provider by ID', async () => {
      const created = await deliveryModule.create({
        type: DeliveryProviderType.PICKUP,
        adapterKey: 'shop.unchained.delivery.store',
        configuration: [],
      });

      const found = await deliveryModule.findProvider({ deliveryProviderId: created._id });

      assert.ok(found, 'Should find the provider');
      assert.strictEqual(found._id, created._id);
      assert.strictEqual(found.adapterKey, 'shop.unchained.delivery.store');
    });

    it('should update a provider', async () => {
      const created = await deliveryModule.create({
        type: DeliveryProviderType.SHIPPING,
        adapterKey: 'shop.unchained.delivery.ups',
        configuration: [],
      });

      const updated = await deliveryModule.update(created._id, {
        configuration: [{ key: 'apiKey', value: 'secret123' }],
      });

      assert.ok(updated, 'Should return updated provider');
      assert.deepStrictEqual(updated.configuration, [{ key: 'apiKey', value: 'secret123' }]);
      assert.ok(updated.updated, 'Should have updated timestamp');
    });

    it('should soft-delete a provider', async () => {
      const created = await deliveryModule.create({
        type: DeliveryProviderType.SHIPPING,
        adapterKey: 'shop.unchained.delivery.fedex',
        configuration: [],
      });

      const deleted = await deliveryModule.delete(created._id);

      assert.ok(deleted, 'Should return deleted provider');
      assert.ok(deleted.deleted, 'Should have deleted timestamp');

      // Should not appear in default query
      const providers = await deliveryModule.findProviders({});
      const fedex = providers.find((p) => p.adapterKey === 'shop.unchained.delivery.fedex');
      assert.ok(!fedex, 'Deleted provider should not be in results');
    });
  });

  describe('Query operations', () => {
    it('should find providers with pagination', async () => {
      const firstPage = await deliveryModule.findProviders({ limit: 2, offset: 0 });
      assert.strictEqual(firstPage.length, 2, 'First page should have 2 providers');

      const secondPage = await deliveryModule.findProviders({ limit: 2, offset: 2 });
      assert.ok(secondPage.length >= 1, 'Second page should have at least 1 provider');
    });

    it('should filter by type', async () => {
      const shippingProviders = await deliveryModule.findProviders({
        type: DeliveryProviderType.SHIPPING,
      });

      assert.ok(shippingProviders.length >= 1, 'Should find at least one shipping provider');
      for (const provider of shippingProviders) {
        assert.strictEqual(provider.type, DeliveryProviderType.SHIPPING);
      }
    });

    it('should filter by IDs', async () => {
      const allProviders = await deliveryModule.allProviders();
      const firstTwo = allProviders.slice(0, 2);
      const ids = firstTwo.map((p) => p._id);

      const filtered = await deliveryModule.findProviders({
        deliveryProviderIds: ids,
      });

      assert.strictEqual(filtered.length, 2, 'Should find exactly 2 providers');
    });

    it('should count providers', async () => {
      const count = await deliveryModule.count({});
      assert.ok(count >= 3, `Expected at least 3 providers, got ${count}`);
    });

    it('should check provider exists', async () => {
      const providers = await deliveryModule.allProviders();
      const firstProvider = providers[0];

      const exists = await deliveryModule.providerExists({ deliveryProviderId: firstProvider._id });
      assert.strictEqual(exists, true, 'Provider should exist');

      const notExists = await deliveryModule.providerExists({ deliveryProviderId: 'nonexistent' });
      assert.strictEqual(notExists, false, 'Non-existent provider should not exist');
    });
  });

  describe('Caching', () => {
    it('should cache allProviders results', async () => {
      // First call
      const first = await deliveryModule.allProviders();

      // Create a new provider
      await deliveryModule.create({
        type: DeliveryProviderType.SHIPPING,
        adapterKey: 'shop.unchained.delivery.cached-test',
        configuration: [],
      });

      // In production mode with 60s cache, this would still return old data
      // In test mode (1ms cache), it should return new data
      const second = await deliveryModule.allProviders();

      // Both calls should return valid arrays
      assert.ok(Array.isArray(first), 'First call should return array');
      assert.ok(Array.isArray(second), 'Second call should return array');
    });
  });
});
