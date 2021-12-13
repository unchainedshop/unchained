import { TimestampFields } from './common';

export enum DeliveryProviderType {
  SHIPPING = 'SHIPPING',
  PICKUP = 'PICKUP',
}

export type DeliveryProvider = {
  type: string;
  adapterKey: string;
  authorId: string;
  configuration: Array<{ key: string; value: string }>;
} & TimestampFields;

