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

export default async function seedWarehousings(db) {
  await chainedUpsert(db)
    .upsert('warehousing-providers', SimpleWarehousingProvider)
    .upsert('warehousing-providers', VirtualWarehousingProvider)
    .resolve();
}
