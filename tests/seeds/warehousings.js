import chainedUpsert from './utils/chainedUpsert.js';

export const SimpleWarehousingProvider = {
  _id: 'simple-warehousing-provider',
  adapterKey: 'shop.unchained.warehousing.store',
  created: new Date('2019-10-04T13:52:57.938+0000'),
  configuration: [],
  type: 'PHYSICAL',
};

export const VirtualWarehousingProvider = {
  _id: 'virtual-warehousing-provider',
  created: new Date('2019-10-04T13:52:57.938+0000'),
  configuration: [
    {
      key: 'chainId',
      value: '0',
    },
  ],
  type: 'VIRTUAL',
  adapterKey: 'shop.unchained.warehousing.infinite-minter',
};

// All warehousing providers for seeding
const allWarehousingProviders = [SimpleWarehousingProvider, VirtualWarehousingProvider];

export default async function seedWarehousings(db) {
  await chainedUpsert(db)
    .upsert('warehousing-providers', SimpleWarehousingProvider)
    .upsert('warehousing-providers', VirtualWarehousingProvider)
    .resolve();
}

/**
 * Seed warehousing providers into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid emitting events.
 */
export async function seedWarehousingProvidersToDrizzle(db) {
  const { warehousingProviders } = await import('@unchainedshop/core-warehousing');

  // Delete all existing warehousing providers directly
  await db.delete(warehousingProviders);

  // Insert all warehousing providers directly (bypassing module to avoid emitting events)
  for (const provider of allWarehousingProviders) {
    await db.insert(warehousingProviders).values({
      _id: provider._id,
      type: provider.type,
      adapterKey: provider.adapterKey,
      configuration: provider.configuration || null,
      created: provider.created,
      updated: null,
      deleted: null,
    });
  }
}
