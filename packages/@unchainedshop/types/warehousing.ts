import { Context } from './api';
import {
  ModuleMutations,
  Query,
  TimestampFields,
  _ID,
  FindOptions,
} from './common';

export enum WarehousingProviderType {
  PHYSICAL = 'PHYSICAL',
}

export type WarehousingProvider = {
  _id?: _ID;
  type: WarehousingProviderType;
  adapterKey: string;
  authorId: string;
  configuration: Array<{ key: string; value: string }>;
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
  deliveryProvider?: any; // TODO: Replace with orderPayment type
  product?: any; // TODO: Replace with order type
  quantity?: number;
  referenceDate?: Date;
  userId?: string;
  warehousingProviderId?: string;
}

export interface WarehousingAdapter {
  configurationError: () => WarehouseError | string; // OPEN QUESTION: Should it be fixed to the WarehouseError const
  isActive: () => boolean;
  stock: (referenceDate: Date) => Promise<number>;
  productionTime: (quantityToProduce: number) => Promise<number>;
  commissioningTime: (quantity: number) => Promise<number>;
}

export interface WarehousingDirector {
  configurationError: () => WarehouseError; // OPEN QUESTION: Should it be fixed to the PaymentError const
  isActive: () => boolean;
  throughputTime: (context: WarehousingContext) => Promise<number>;
  estimatedStock: (
    context: WarehousingContext
  ) => Promise<{ quantity: number } | null>;
  estimatedDispatch: (
    context: WarehousingContext
  ) => Promise<{ shipping?: Date; earliestDelivery?: Date }>;
}

export interface WarehousingInterface {
  _id: string;
  label: string;
  version: string;
}

export type WarehousingModule = ModuleMutations<WarehousingProvider> & {
  findProvider: (
    query: { warehousingProviderId: string },
    options?: FindOptions<WarehousingProvider>
  ) => Promise<WarehousingProvider>;
  findProviders: (
    query: WarehousingProviderQuery,
    options?: FindOptions<WarehousingProvider>
  ) => Promise<Array<WarehousingProvider>>;
  count: (query: WarehousingProviderQuery) => Promise<number>;
  providerExists: (query: {
    warehousingProviderId: string;
  }) => Promise<boolean>;

  findSupported: () => Promise<Array<WarehousingProvider>>;
  findInterface: (query: WarehousingProvider) => WarehousingInterface;
  findInterfaces: (
    query: WarehousingProviderQuery
  ) => Array<WarehousingInterface>;

  // Adapter
  configurationError: (provider: WarehousingProvider) => WarehousingError;
  isActive: (provider: WarehousingProvider) => boolean;
};

type HelperType<P, T> = (
  provider: WarehousingProvider,
  params: P,
  context: Context
) => T;

export interface WarehousingProviderHelperTypes {
  configurationError: HelperType<never, WarehousingError>;
  interface: HelperType<never, WarehousingInterface>;
  isActive: HelperType<never, boolean>;
}
