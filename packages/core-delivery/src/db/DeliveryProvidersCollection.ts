import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { DeliveryProvider } from '../types.js';

export const DeliveryProvidersCollection = async (db: mongodb.Db) => {
  const DeliveryProviders = db.collection<DeliveryProvider>('delivery-providers');

  await buildDbIndexes<DeliveryProvider>(DeliveryProviders, [
    { index: { type: 1 } },
    { index: { created: 1 } },
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return DeliveryProviders;
};
