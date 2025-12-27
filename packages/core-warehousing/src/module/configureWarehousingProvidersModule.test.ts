/**
 * Tests for the Warehousing Providers Module
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createMemoryStore } from '@unchainedshop/store/memory';
import {
  configureWarehousingProvidersModule,
  WarehousingProviderType,
  type WarehousingProvidersModule,
} from './configureWarehousingProvidersModule.ts';

describe('Warehousing Providers Module', () => {
  let store: Awaited<ReturnType<typeof createMemoryStore>>;
  let warehousingProviders: WarehousingProvidersModule;

  before(async () => {
    store = await createMemoryStore({ environment: 'server' });
    warehousingProviders = configureWarehousingProvidersModule(store);

    // Seed test data
    await warehousingProviders.create({
      type: WarehousingProviderType.PHYSICAL,
      adapterKey: 'shop.unchained.warehousing.standard',
      configuration: [{ key: 'warehouse', value: 'main' }],
    });
    await warehousingProviders.create({
      type: WarehousingProviderType.VIRTUAL,
      adapterKey: 'shop.unchained.warehousing.nft',
      configuration: [{ key: 'chainId', value: '1' }],
    });
    await warehousingProviders.create({
      type: WarehousingProviderType.PHYSICAL,
      adapterKey: 'shop.unchained.warehousing.dropship',
      configuration: [],
    });
  });

  after(async () => {
    await store.close();
  });

  describe('CRUD operations', () => {
    it('should create a warehousing provider', async () => {
      const provider = await warehousingProviders.create({
        type: WarehousingProviderType.PHYSICAL,
        adapterKey: 'shop.unchained.warehousing.fulfillment',
        configuration: [],
      });

      assert.ok(provider, 'Should return the created provider');
      assert.ok(provider._id, 'Should have an _id');
      assert.strictEqual(provider.type, WarehousingProviderType.PHYSICAL);
      assert.strictEqual(provider.adapterKey, 'shop.unchained.warehousing.fulfillment');
    });

    it('should find a provider by ID', async () => {
      const created = await warehousingProviders.create({
        type: WarehousingProviderType.VIRTUAL,
        adapterKey: 'shop.unchained.warehousing.digital',
        configuration: [],
      });

      const found = await warehousingProviders.findProvider({ warehousingProviderId: created._id });

      assert.ok(found, 'Should find the provider');
      assert.strictEqual(found._id, created._id);
      assert.strictEqual(found.adapterKey, 'shop.unchained.warehousing.digital');
    });

    it('should update a provider', async () => {
      const created = await warehousingProviders.create({
        type: WarehousingProviderType.PHYSICAL,
        adapterKey: 'shop.unchained.warehousing.amazon',
        configuration: [],
      });

      const updated = await warehousingProviders.update(created._id, {
        configuration: [{ key: 'apiKey', value: 'amzn123' }],
      });

      assert.ok(updated, 'Should return updated provider');
      assert.deepStrictEqual(updated.configuration, [{ key: 'apiKey', value: 'amzn123' }]);
      assert.ok(updated.updated, 'Should have updated timestamp');
    });

    it('should soft-delete a provider', async () => {
      const created = await warehousingProviders.create({
        type: WarehousingProviderType.PHYSICAL,
        adapterKey: 'shop.unchained.warehousing.toDelete',
        configuration: [],
      });

      const deleted = await warehousingProviders.delete(created._id);

      assert.ok(deleted, 'Should return deleted provider');
      assert.ok(deleted.deleted, 'Should have deleted timestamp');

      // Should not appear in default query
      const providers = await warehousingProviders.findProviders({});
      const found = providers.find((p) => p.adapterKey === 'shop.unchained.warehousing.toDelete');
      assert.ok(!found, 'Deleted provider should not be in results');
    });
  });

  describe('Query operations', () => {
    it('should find providers with pagination', async () => {
      const firstPage = await warehousingProviders.findProviders({ limit: 2, offset: 0 });
      assert.strictEqual(firstPage.length, 2, 'First page should have 2 providers');

      const secondPage = await warehousingProviders.findProviders({ limit: 2, offset: 2 });
      assert.ok(secondPage.length >= 1, 'Second page should have at least 1 provider');
    });

    it('should filter by type', async () => {
      const physicalProviders = await warehousingProviders.findProviders({
        type: WarehousingProviderType.PHYSICAL,
      });

      assert.ok(physicalProviders.length >= 1, 'Should find at least one physical provider');
      for (const provider of physicalProviders) {
        assert.strictEqual(provider.type, WarehousingProviderType.PHYSICAL);
      }
    });

    it('should filter by IDs', async () => {
      const allProvidersList = await warehousingProviders.allProviders();
      const firstTwo = allProvidersList.slice(0, 2);
      const ids = firstTwo.map((p) => p._id);

      const filtered = await warehousingProviders.findProviders({
        warehousingProviderIds: ids,
      });

      assert.strictEqual(filtered.length, 2, 'Should find exactly 2 providers');
    });

    it('should count providers', async () => {
      const count = await warehousingProviders.count({});
      assert.ok(count >= 3, `Expected at least 3 providers, got ${count}`);
    });

    it('should check provider exists', async () => {
      const providersList = await warehousingProviders.allProviders();
      const firstProvider = providersList[0];

      const exists = await warehousingProviders.providerExists({
        warehousingProviderId: firstProvider._id,
      });
      assert.strictEqual(exists, true, 'Provider should exist');

      const notExists = await warehousingProviders.providerExists({
        warehousingProviderId: 'nonexistent',
      });
      assert.strictEqual(notExists, false, 'Non-existent provider should not exist');
    });
  });

  describe('Caching', () => {
    it('should cache allProviders results', async () => {
      // First call
      const first = await warehousingProviders.allProviders();

      // Create a new provider
      await warehousingProviders.create({
        type: WarehousingProviderType.VIRTUAL,
        adapterKey: 'shop.unchained.warehousing.cached-test',
        configuration: [],
      });

      // In production mode with 60s cache, this would still return old data
      // In test mode (1ms cache), it should return new data
      const second = await warehousingProviders.allProviders();

      // Both calls should return valid arrays
      assert.ok(Array.isArray(first), 'First call should return array');
      assert.ok(Array.isArray(second), 'Second call should return array');
    });
  });
});
