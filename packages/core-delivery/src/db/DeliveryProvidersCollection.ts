import { Db } from '@unchainedshop/types/common';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { buildDbIndexes } from '@unchainedshop/utils';

export const DeliveryProvidersCollection = async (db: Db) => {
  const DeliveryProviders = db.collection<DeliveryProvider>('delivery-providers');

  await buildDbIndexes<DeliveryProvider>(DeliveryProviders, [{ index: { type: 1 } }]);

  return DeliveryProviders;
};
