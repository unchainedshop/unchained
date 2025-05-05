import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

export enum WarehousingProviderType {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
}

export type WarehousingConfiguration = { key: string; value: string }[];

export type WarehousingProvider = {
  _id?: string;
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
