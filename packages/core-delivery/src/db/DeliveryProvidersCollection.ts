import { Db } from '@unchainedshop/types/common';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { buildDbIndexes } from 'meteor/unchained:utils'

export const DeliveryProvidersCollection = async (db: Db) => {
  const DeliveryProviders = db.collection<DeliveryProvider>('delivery-providers');

  await buildDbIndexes<DeliveryProvider>(DeliveryProviders, [
    () => DeliveryProviders.createIndex({ isoCode: 1 }, { unique: true }),
  ]);

  return DeliveryProviders;
};
