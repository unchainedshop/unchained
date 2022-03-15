import { Context } from './api';
import {
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  ModuleMutations,
  TimestampFields,
  _ID,
} from './common';
import { DeliveryProvider } from './delivery';
import { Product } from './products';

export enum WarehousingProviderType {
  PHYSICAL = 'PHYSICAL',
}

export type WarehousingConfiguration = Array<{ key: string; value: string }>;

export type WarehousingProvider = {
  _id?: _ID;
  type: WarehousingProviderType;
  adapterKey: string;
  authorId: string;
  configuration: WarehousingConfiguration;
} & TimestampFields;

type WarehousingProviderQuery = {
  type?: WarehousingProviderType;
};

export enum WarehousingError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export interface WarehousingContext {
  deliveryProvider?: DeliveryProvider;
  product?: Product;
  quantity?: number;
  referenceDate?: Date;
  warehousingProviderId?: string;
}

export type IWarehousingAdapter = IBaseAdapter & {
  orderIndex: number;
  initialConfiguration: WarehousingConfiguration;
  typeSupported: (type: WarehousingProviderType) => boolean;

  actions: (
    config: WarehousingConfiguration,
    context: WarehousingContext & Context,
  ) => {
    configurationError: () => WarehousingError;
    isActive: () => boolean;
    stock: (referenceDate: Date) => Promise<number>;
    productionTime: (quantityToProduce: number) => Promise<number>;
    commissioningTime: (quantity: number) => Promise<number>;
  };
};

type EstimatedDispatch = {
  shipping?: Date;
  earliestDelivery?: Date;
};
export type IWarehousingDirector = IBaseDirector<IWarehousingAdapter> & {
  actions: (
    warehousingProvider: WarehousingProvider,
    warehousingContext: WarehousingContext,
    requestContext: Context,
  ) => {
    configurationError: () => WarehousingError;
    isActive: () => boolean;
    throughputTime: () => Promise<number>;
    estimatedStock: () => Promise<{ quantity: number } | null>;
    estimatedDispatch: () => Promise<EstimatedDispatch>;
  };
};

export interface WarehousingInterface {
  _id: string;
  label: string;
  version: string;
}

export type WarehousingModule = Omit<ModuleMutations<WarehousingProvider>, 'delete'> & {
  // Queries
  findProvider: (
    query: { warehousingProviderId: string },
    options?: FindOptions,
  ) => Promise<WarehousingProvider>;
  findProviders: (
    query: WarehousingProviderQuery,
    options?: FindOptions,
  ) => Promise<Array<WarehousingProvider>>;
  count: (query: WarehousingProviderQuery) => Promise<number>;
  providerExists: (query: { warehousingProviderId: string }) => Promise<boolean>;

  // Adapter

  findSupported: (
    warehousingContext: WarehousingContext,
    requestContext: Context,
  ) => Promise<Array<WarehousingProvider>>;
  findInterface: (query: WarehousingProvider) => WarehousingInterface;
  findInterfaces: (query: WarehousingProviderQuery) => Array<WarehousingInterface>;
  configurationError: (provider: WarehousingProvider, requestContext: Context) => WarehousingError;
  isActive: (provider: WarehousingProvider, requestContext: Context) => boolean;

  estimatedDispatch: (
    provider: WarehousingProvider,
    context: WarehousingContext,
    requestContext: Context,
  ) => Promise<EstimatedDispatch>;

  // Mutations
  delete: (providerId: string, userId?: string) => Promise<WarehousingProvider>;
};

type HelperType<P, T> = (provider: WarehousingProvider, params: P, context: Context) => T;

export interface WarehousingProviderHelperTypes {
  configurationError: HelperType<never, WarehousingError>;
  interface: HelperType<never, WarehousingInterface>;
  isActive: HelperType<never, boolean>;
}
