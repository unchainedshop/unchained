import { mongodb, buildDbIndexes, type TimestampFields } from '@unchainedshop/mongodb';

export const DeliveryProviderType = {
  SHIPPING: 'SHIPPING',
  PICKUP: 'PICKUP',
} as const;

export type DeliveryProviderType = (typeof DeliveryProviderType)[keyof typeof DeliveryProviderType];

export type DeliveryConfiguration = {
  key: string;
  value: string;
}[];

export type DeliveryProvider = {
  _id: string;
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
