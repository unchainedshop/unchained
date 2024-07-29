import type { Work } from '@unchainedshop/core-worker';
import type { TimestampFields } from '@unchainedshop/mongodb';
import type { User } from '@unchainedshop/core-users';

import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Order } from '@unchainedshop/core-orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries.js';
import { OrderPosition } from '@unchainedshop/types/orders.positions.js';
import { Product } from '@unchainedshop/types/products.js';
import { WarehousingProvider } from '@unchainedshop/core-warehousing';

export enum DeliveryProviderType {
  SHIPPING = 'SHIPPING',
  PICKUP = 'PICKUP',
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

export enum DeliveryError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export interface DeliveryContext {
  country?: string;
  deliveryProvider?: DeliveryProvider;
  order?: Order;
  orderDelivery?: OrderDelivery;
  orderPosition?: OrderPosition;
  product?: Product;
  quantity?: number;
  referenceDate?: Date;
  transactionContext?: any;
  user?: User;
  warehousingProvider?: WarehousingProvider;
  warehousingThroughputTime?: number;
}

export type DeliveryAdapterContext = DeliveryContext & UnchainedCore;

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

export interface DeliveryAdapterActions {
  configurationError: (transactionContext?: any) => DeliveryError;
  estimatedDeliveryThroughput: (warehousingThroughputTime: number) => Promise<number>;
  isActive: () => boolean;
  isAutoReleaseAllowed: () => boolean;
  pickUpLocationById: (locationId: string) => Promise<DeliveryLocation>;
  pickUpLocations: () => Promise<Array<DeliveryLocation>>;
  send: () => Promise<boolean | Work>;
}
export type IDeliveryAdapter = IBaseAdapter & {
  initialConfiguration: DeliveryConfiguration;

  typeSupported: (type: DeliveryProviderType) => boolean;

  actions: (config: DeliveryConfiguration, context: DeliveryAdapterContext) => DeliveryAdapterActions;
};

export type IDeliveryDirector = IBaseDirector<IDeliveryAdapter> & {
  actions: (
    deliveryProvider: DeliveryProvider,
    deliveryContext: DeliveryContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<DeliveryAdapterActions>;
};

/*
 * Module
 */

export interface DeliveryInterface {
  _id: string;
  label: string;
  version: string;
}

export type FilterProviders = (
  params: {
    providers: Array<DeliveryProvider>;
    order: Order;
  },
  unchainedAPI: UnchainedCore,
) => Promise<Array<DeliveryProvider>>;
