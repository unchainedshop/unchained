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

/**
 * Seed warehousing providers into the store.
 */
export async function seedWarehousingsToStore(store) {
  const WarehousingProviders = store.table('warehousing-providers');

  // Clear existing providers
  await WarehousingProviders.deleteMany({});

  // Insert all providers
  for (const provider of allWarehousingProviders) {
    await WarehousingProviders.insertOne({
      ...provider,
      deleted: null,
    });
  }
}
