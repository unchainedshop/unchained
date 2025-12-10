import { type mongodb, buildDbIndexes, type TimestampFields } from '@unchainedshop/mongodb';

export const WarehousingProviderType = {
  PHYSICAL: 'PHYSICAL',
  VIRTUAL: 'VIRTUAL',
} as const;

export type WarehousingProviderType =
  (typeof WarehousingProviderType)[keyof typeof WarehousingProviderType];

export type WarehousingConfiguration = { key: string; value: string }[];

export type WarehousingProvider = {
  _id: string;
  type: WarehousingProviderType;
  adapterKey: string;
  configuration: WarehousingConfiguration;
} & TimestampFields;

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
