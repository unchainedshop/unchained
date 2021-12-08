import { Db } from '@unchainedshop/types/common';
import { WarehousingProvider } from '@unchainedshop/types/warehousing';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const WarehousingProvidersCollection = async (db: Db) => {
  const WarehousingProviders = db.collection<WarehousingProvider>(
    'warehousing-providers'
  );

  await buildDbIndexes<WarehousingProvider>(WarehousingProviders, [
    () =>
      WarehousingProviders.createIndex({
        type: 1,
      }),
  ]);

  return WarehousingProviders;
};
