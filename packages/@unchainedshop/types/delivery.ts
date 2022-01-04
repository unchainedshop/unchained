import { Product } from './products';
import { Context } from './api';
import {
  ModuleMutations,
  Query,
  TimestampFields,
  _ID,
  FindOptions,
  IBaseDirector,
  IBaseAdapter,
} from './common';
import { Order } from './orders';
import { User } from './user';
import { WarehousingProvider } from './warehousing';
import { Work } from './worker';
import { OrderDelivery } from './orders.deliveries';
import { OrderPosition } from './orders.positions';

export enum DeliveryProviderType {
  SHIPPING = 'SHIPPING',
  PICKUP = 'PICKUP',
}

export type DeliveryConfiguration = Array<{
  key: string;
  value: string;
}>;

export type DeliveryProvider = {
  _id?: _ID;
  type: string;
  adapterKey: string;
  authorId: string;
  configuration: DeliveryConfiguration;
} & TimestampFields;

type DeliveryProviderQuery = {
  type?: DeliveryProviderType;
  deleted?: Date;
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

export type DeliveryAdapterContext = DeliveryContext & Context;

interface DeliveryAdapterActions {
  configurationError: () => DeliveryError;
  estimatedDeliveryThroughput: (
    warehousingThroughputTime: number
  ) => Promise<number>;
  isActive: () => boolean;
  isAutoReleaseAllowed: () => boolean;
  pickUpLocationById: (locationId: string) => Promise<DeliveryLocation>;
  pickUpLocations: () => Promise<Array<DeliveryLocation>>;
  send: () => Promise<boolean | Work>;
}
export type IDeliveryAdapter = IBaseAdapter & {
  initialConfiguration: DeliveryConfiguration;

  typeSupported: (type: DeliveryProviderType) => boolean;

  actions: (
    config: DeliveryConfiguration,
    context: DeliveryAdapterContext
  ) => DeliveryAdapterActions;
};

export type IDeliveryDirector = IBaseDirector<IDeliveryAdapter> & {
  actions: (
    deliveryProvider: DeliveryProvider,
    deliveryContext: DeliveryContext,
    requestContext: Context
  ) => DeliveryAdapterActions;
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
export type DeliveryModule = ModuleMutations<DeliveryProvider> & {
  // Queries
  count: (query: DeliveryProviderQuery) => Promise<number>;
  findProvider: (
    query:
      | {
          deliveryProviderId: string;
        }
      | Query,
    options?: FindOptions<DeliveryProvider>
  ) => Promise<DeliveryProvider>;
  findProviders: (
    query: DeliveryProviderQuery,
    options?: FindOptions<DeliveryProvider>
  ) => Promise<Array<DeliveryProvider>>;

  providerExists: (query: { deliveryProviderId: string }) => Promise<boolean>;

  // Delivery adapter
  findInterface: (params: DeliveryProvider) => IDeliveryAdapter;
  findInterfaces: (params: {
    type: DeliveryProviderType;
  }) => Array<IDeliveryAdapter>;
  findSupported: (
    params: { order: Order },
    requestContext: Context
  ) => Promise<Array<string>>;

  send: (
    deliveryProviderId: string,
    deliveryContext: DeliveryContext,
    requestContext: Context
  ) => Promise<any>;
};

type HelperType<P, T> = (
  provider: DeliveryProvider,
  params: P,
  context: Context
) => T;

export interface DeliveryProviderHelperTypes {
  interface: HelperType<
    never,
    {
      _id: string;
      label: string;
      version: string;
    }
  >;
  simulatedPrice: HelperType<
    {
      currency?: string;
      orderId: string;
      useNetPrice?: boolean;
      context: any;
    },
    Promise<{
      _id: string;
      amount: number;
      currencyCode: string;
      countryCode: string;
      isTaxable: boolean;
      isNetPrice: boolean;
    }>
  >;
}
