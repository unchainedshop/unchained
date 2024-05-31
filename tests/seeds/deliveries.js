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
  created: new Date('2019-10-11T10:23:35.959+0000'),
  configuration: [
    {
      key: 'stores',
      value: JSON.stringify([{ _id: 'zurich', name: 'Zurich' }]),
    },
  ],
  type: 'PICKUP',
  updated: new Date('2019-10-11T10:23:37.337+0000'),
};

export default async function seedPayments(db) {
  await chainedUpsert(db)
    .upsert('delivery-providers', SimpleDeliveryProvider)
    .upsert('delivery-providers', SendMailDeliveryProvider)
    .upsert('delivery-providers', PickupDeliveryProvider)
    .resolve();
}
