import { Context } from './api';
import { TimestampFields, _ID } from './common';
import { OrderDelivery } from './orders';
import { WarehousingProvider } from './warehousing';
import { Work } from './worker';

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
  product?: any; // TODO: Replace with product type
  quantity?: number;
  referenceDate?: Date;
  user?: User;
  warehousingProvider?: WarehousingProvider;
  warehousingThroughputTime?: number;
}

export type DeliveryAdapterContext = DeliveryContext & Context

export interface DeliveryAdapter {
  configurationError: () => DeliveryError;
  estimatedDeliveryThroughput: (
    warehousingThroughputTime: number
  ) => Promise<number>;
  isActive: () => boolean;
  isAutoReleaseAllowed: () => boolean;
  pickUpLocationById: (locationId: string) => Promise<DeliveryLocation>;
  pickUpLocations: () => Promise<Array<DeliveryLocation>>;
  send: (transactionContext: any) => Promise<boolean | Work>;
}

export interface DeliveryDirector {
  configurationError: () => DeliveryError;
  estimatedDeliveryThroughput: (data: {
    warehousingThroughputTime: number;
  }) => Promise<number>;
  isActive: () => boolean;
  isAutoReleaseAllowed: () => boolean;
  send: (transactionContext: any) => Promise<boolean | Work>;
  run: (command: string, args: any) => Promise<boolean>;
}

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
    query: Query & {
      deliveryProviderId: string;
    },
    options?: FindOptions<DeliveryProvider>
  ) => Promise<DeliveryProvider>;
  findProviders: (
    query: DeliveryProviderQuery,
    options?: FindOptions<DeliveryProvider>
  ) => Promise<Array<DeliveryProvider>>;

  providerExists: (query: { deliveryProviderId: string }) => Promise<boolean>;

  // Delivery adapter
  findInterface: (query: DeliveryProvider) => DeliveryInterface;
  findInterfaces: (query: {
    type: DeliveryProviderType;
  }) => Array<DeliveryInterface>;
  findSupported: (
    query: { order: any } // TODO: Replace order type
  ) => Array<string>;

  /* REMARK: Use director directly
  configurationError: (deliveryProvider: DeliveryProvider) => DeliveryError;
  isActive: (context: DeliveryContext) => Promise<boolean>;
  isAutoReleaseAllowed: (context: DeliveryContext) => boolean;
  estimatedDeliveryThroughput: (context: DeliveryContext) => Promise<number>;
  send: (
    transactionContext: any // Defined as { paymentContext, deliveryContext, orderContext }
  ) => Promise<Work>;

  // Clarfiy why to use the generic run pattern and not specific commands
  run: (
    name: string,
    params: { orderDelivery: OrderDelivery },
    args: any
  ) => Promise<DeliveryLocation | Array<DeliveryLocation>>;
  */
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
  configurationError: HelperType<never, DeliveryError>;
  orderPrice: HelperType<
    {
      country?: string;
      currency?: string;
      order: Order;
      useNetPrice?: boolean;
      user: User;
      providerContext: any;
    },
    {
      _id: string;
      amount: number;
      currencyCode: string;
      countryCode: string;
      isTaxable: boolean;
      isNetPrice: boolean;
    }
  >;
}
