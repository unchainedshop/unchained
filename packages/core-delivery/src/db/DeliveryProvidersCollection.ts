import { Db } from '@unchainedshop/types/common.js';
import { DeliveryProvider } from '@unchainedshop/types/delivery.js';
import { buildDbIndexes } from '@unchainedshop/mongodb';

export const DeliveryProvidersCollection = async (db: Db) => {
  const DeliveryProviders = db.collection<DeliveryProvider>('delivery-providers');

  await buildDbIndexes<DeliveryProvider>(DeliveryProviders, [{ index: { type: 1 } }]);

  return DeliveryProviders;
};
