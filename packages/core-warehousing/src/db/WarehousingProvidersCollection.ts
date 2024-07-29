import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { WarehousingProvider } from '../types.js';

export const WarehousingProvidersCollection = async (db: mongodb.Db) => {
  const WarehousingProviders = db.collection<WarehousingProvider>('warehousing-providers');

  await buildDbIndexes<WarehousingProvider>(WarehousingProviders, [
    {
      index: {
        type: 1,
      },
    },
    {
      index: {
        created: 1,
      },
    },
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return WarehousingProviders;
};
