import { TimestampFields } from '@unchainedshop/mongodb';

export enum DeliveryProviderType {
  SHIPPING = 'SHIPPING',
  PICKUP = 'PICKUP',
}

export enum DeliveryError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}
export type DeliveryConfiguration = Array<{
  key: string;
  value: string;
}>;

export type DeliveryProvider = {
  _id?: string;
  type: DeliveryProviderType;
  adapterKey: string;
  configuration: DeliveryConfiguration;
} & TimestampFields;

export type DeliveryProviderQuery = {
  type?: DeliveryProviderType;
};

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
