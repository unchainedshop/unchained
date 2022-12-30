import { Db } from '@unchainedshop/types/common.js';
import { WarehousingProvider } from '@unchainedshop/types/warehousing';
import { buildDbIndexes } from '@unchainedshop/utils';

export const WarehousingProvidersCollection = async (db: Db) => {
  const WarehousingProviders = db.collection<WarehousingProvider>('warehousing-providers');

  await buildDbIndexes<WarehousingProvider>(WarehousingProviders, [
    {
      index: {
        type: 1,
      },
    },
  ]);

  return WarehousingProviders;
};
