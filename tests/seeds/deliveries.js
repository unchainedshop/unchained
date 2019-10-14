export const SimpleDeliveryProvider = {
  _id: 'simple-delivery-provider',
  adapterKey: 'shop.unchained.post',
  created: new Date('2019-10-11T10:23:35.959+0000'),
  configuration: [],
  type: 'SHIPPING',
  updated: new Date('2019-10-11T10:23:37.337+0000')
};

export default async function seedDeliveries(db) {
  await db
    .collection('delivery-providers')
    .findOrInsertOne(SimpleDeliveryProvider);
}
