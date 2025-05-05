import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

export enum DeliveryProviderType {
  SHIPPING = 'SHIPPING',
  PICKUP = 'PICKUP',
}
export type DeliveryConfiguration = {
  key: string;
  value: string;
}[];

export type DeliveryProvider = {
  _id?: string;
  type: DeliveryProviderType;
  adapterKey: string;
  configuration: DeliveryConfiguration;
} & TimestampFields;

export interface DeliveryLocation {
  _id: string;
  name: string;
  address: {
    addressLine: string;
    addressLine2?: string;
    postalCode: string;
    countryCode: string;
    city: string;
  };
  geoPoint: {
    latitude: number;
    longitude: number;
  };
}
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
