import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { DeliveryProvider } from '@unchainedshop/types/delivery.js';

export const DeliveryProvidersCollection = async (db: mongodb.Db) => {
  const DeliveryProviders = db.collection<DeliveryProvider>('delivery-providers');

  await buildDbIndexes<DeliveryProvider>(DeliveryProviders, [
    { index: { type: 1 } },
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return DeliveryProviders;
};
