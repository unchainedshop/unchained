import type { Filter, FindOptions } from 'mongodb';
import type { Work } from '@unchainedshop/core-worker';

import { TimestampFields } from './common.js';
import { ModuleMutationsWithReturnDoc, UnchainedCore } from './core.js';

import {
  DeliveryPricingCalculation,
  DeliveryPricingContext,
  IDeliveryPricingSheet,
} from './delivery.pricing.js';
import { Order } from './orders.js';
import { OrderDelivery } from './orders.deliveries.js';
import { OrderPosition } from './orders.positions.js';
import { Product } from './products.js';
import { User } from './user.js';
import { WarehousingProvider } from './warehousing.js';
import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';

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

export type DeliveryModule = ModuleMutationsWithReturnDoc<DeliveryProvider> & {
  // Queries
  count: (query: Filter<DeliveryProvider>) => Promise<number>;
  findProvider: (
    query: {
      deliveryProviderId: string;
    } & Filter<DeliveryProvider>,
    options?: FindOptions,
  ) => Promise<DeliveryProvider>;
  findProviders: (
    query: Filter<DeliveryProvider>,
    options?: FindOptions,
  ) => Promise<Array<DeliveryProvider>>;

  providerExists: (query: { deliveryProviderId: string }) => Promise<boolean>;

  pricingSheet: (params: {
    calculation: Array<DeliveryPricingCalculation>;
    currency: string;
  }) => IDeliveryPricingSheet;

  // Delivery adapter
  findInterface: (params: DeliveryProvider) => DeliveryInterface;
  findInterfaces: (params: { type: DeliveryProviderType }) => Array<DeliveryInterface>;
  findSupported: (
    params: { order: Order },
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<DeliveryProvider>>;
  determineDefault: (
    deliveryProviders: Array<DeliveryProvider>,
    params: { order: Order },
    unchainedAPI: UnchainedCore,
  ) => Promise<DeliveryProvider>;

  isActive: (deliveryProvider: DeliveryProvider, unchainedAPI: UnchainedCore) => Promise<boolean>;
  configurationError: (
    deliveryProvider: DeliveryProvider,
    unchainedAPI: UnchainedCore,
  ) => Promise<DeliveryError>;

  isAutoReleaseAllowed: (
    deliveryProvider: DeliveryProvider,
    unchainedAPI: UnchainedCore,
  ) => Promise<boolean>;
  calculate: (
    pricingContext: DeliveryPricingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<DeliveryPricingCalculation>>;
  send: (
    deliveryProviderId: string,
    deliveryContext: DeliveryContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<any>;
};

/*
 * Settings
 */

export type FilterProviders = (
  params: {
    providers: Array<DeliveryProvider>;
    order: Order;
  },
  unchainedAPI: UnchainedCore,
) => Promise<Array<DeliveryProvider>>;

export type DetermineDefaultProvider = (
  params: {
    providers: Array<DeliveryProvider>;
    order: Order;
  },
  unchainedAPI: UnchainedCore,
) => Promise<DeliveryProvider>;
export interface DeliverySettingsOptions {
  sortProviders?: (a: DeliveryProvider, b: DeliveryProvider) => number;
  filterSupportedProviders?: FilterProviders;
  determineDefaultProvider?: DetermineDefaultProvider;
}

export interface DeliverySettings {
  filterSupportedProviders: FilterProviders;
  determineDefaultProvider: DetermineDefaultProvider;
  configureSettings: (options?: DeliverySettingsOptions) => void;
}
