export const SimpleDeliveryProvider = {
  _id: 'simple-delivery-provider',
  adapterKey: 'shop.unchained.post',
  created: new Date('2019-10-11T10:23:35.959+0000'),
  configuration: [],
  type: 'SHIPPING',
  updated: new Date('2019-10-11T10:23:37.337+0000'),
};

export const SendMailDeliveryProvider = {
  _id: 'send-mail-delivery-provider',
  adapterKey: 'shop.unchained.delivery.send-message',
  created: new Date('2019-10-11T10:24:35.959+0000'),
  configuration: [],
  type: 'SHIPPING',
  updated: new Date('2019-10-11T10:23:37.337+0000'),
};

export const PickupDeliveryProvider = {
  _id: 'pickup-delivery-provider',
  adapterKey: 'shop.unchained.stores',
  created: new Date('2019-10-11T10:25:35.959+0000'),
  configuration: [
    {
      key: 'stores',
      value: JSON.stringify([{ _id: 'zurich', name: 'Zurich' }]),
    },
  ],
  type: 'PICKUP',
  updated: new Date('2019-10-11T10:23:37.337+0000'),
};

// All delivery providers for seeding
const allDeliveryProviders = [SimpleDeliveryProvider, SendMailDeliveryProvider, PickupDeliveryProvider];

/**
 * Seed delivery providers into the store.
 */
export async function seedDeliveriesToStore(store) {
  const DeliveryProviders = store.table('delivery-providers');

  // Clear existing providers
  await DeliveryProviders.deleteMany({});

  // Insert all providers
  for (const provider of allDeliveryProviders) {
    await DeliveryProviders.insertOne({
      ...provider,
      deleted: null,
    });
  }
}
