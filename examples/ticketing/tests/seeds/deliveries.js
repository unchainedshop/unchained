import chainedUpsert from './utils/chainedUpsert.js';

export const SimpleDeliveryProvider = {
  _id: 'simple-delivery-provider',
  adapterKey: 'shop.unchained.post',
  created: new Date('2019-10-11T10:23:35.959+0000'),
  configuration: [],
  type: 'SHIPPING',
  updated: new Date('2019-10-11T10:23:37.337+0000'),
};

export default async function seedPayments(db) {
  await chainedUpsert(db).upsert('delivery-providers', SimpleDeliveryProvider).resolve();
}
