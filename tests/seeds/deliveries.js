import chainedUpsert from './utils/chainedUpsert.js';

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

export default async function seedPayments(db) {
  await chainedUpsert(db)
    .upsert('delivery-providers', SimpleDeliveryProvider)
    .upsert('delivery-providers', SendMailDeliveryProvider)
    .upsert('delivery-providers', PickupDeliveryProvider)
    .resolve();
}

/**
 * Seed delivery providers into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid emitting events.
 */
export async function seedDeliveryProvidersToDrizzle(db) {
  const { deliveryProviders } = await import('@unchainedshop/core-delivery');

  // Delete all existing delivery providers directly
  await db.delete(deliveryProviders);

  // Insert all delivery providers directly (bypassing module to avoid emitting events)
  for (const provider of allDeliveryProviders) {
    await db.insert(deliveryProviders).values({
      _id: provider._id,
      type: provider.type,
      adapterKey: provider.adapterKey,
      configuration: provider.configuration ? JSON.stringify(provider.configuration) : null,
      created: provider.created,
      updated: provider.updated,
      deleted: null,
    });
  }
}
