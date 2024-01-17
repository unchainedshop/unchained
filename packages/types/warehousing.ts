import type { FindOptions } from 'mongodb';
import { IBaseAdapter, IBaseDirector, TimestampFields, Locale } from './common.js';
import { ModuleMutations, UnchainedCore } from './core.js';
import { DeliveryProvider } from './delivery.js';
import { Order } from './orders.js';
import { OrderPosition } from './orders.positions.js';
import { Product } from './products.js';
import { User } from './user.js';

export enum WarehousingProviderType {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
}

export type WarehousingConfiguration = Array<{ key: string; value: string }>;

export type WarehousingProvider = {
  _id?: string;
  type: WarehousingProviderType;
  adapterKey: string;
  configuration: WarehousingConfiguration;
} & TimestampFields;

export type WarehousingProviderQuery = {
  type?: WarehousingProviderType;
};

export enum WarehousingError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export type TokenSurrogate = {
  _id?: string;
  userId?: string;
  walletAddress?: string;
  quantity: number;
  contractAddress: string;
  chainId: string;
  chainTokenId: string;
  productId: string;
  meta: any;
};

export enum TokenStatus {
  CENTRALIZED = 'CENTRALIZED',
  EXPORTING = 'EXPORTING',
  DECENTRALIZED = 'DECENTRALIZED',
}

export interface WarehousingContext {
  deliveryProvider?: DeliveryProvider;
  product?: Product;
  token?: TokenSurrogate;
  quantity?: number;
  referenceDate?: Date;
  locale?: Locale;
  order?: Order;
  warehousingProviderId?: string;
  orderPosition?: OrderPosition;
}

export type EstimatedDispatch = {
  shipping?: Date;
  earliestDelivery?: Date;
};

export type EstimatedStock = { quantity: number } | null;

export type WarehousingAdapterActions = {
  configurationError: () => WarehousingError;
  isActive: () => boolean;
  stock: (referenceDate: Date) => Promise<number>;
  productionTime: (quantityToProduce: number) => Promise<number>;
  commissioningTime: (quantity: number) => Promise<number>;
  tokenize: () => Promise<Array<Omit<TokenSurrogate, 'userId' | 'productId'>>>;
  tokenMetadata: (chainTokenId: string, referenceDate: Date) => Promise<any>;
};

export type IWarehousingAdapter = IBaseAdapter & {
  orderIndex: number;
  initialConfiguration: WarehousingConfiguration;
  typeSupported: (type: WarehousingProviderType) => boolean;

  actions: (
    config: WarehousingConfiguration,
    context: WarehousingContext & UnchainedCore,
  ) => WarehousingAdapterActions;
};

export type IWarehousingDirector = IBaseDirector<IWarehousingAdapter> & {
  actions: (
    warehousingProvider: WarehousingProvider,
    warehousingContext: WarehousingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<{
    configurationError: () => WarehousingError;
    isActive: () => boolean;
    estimatedStock: () => Promise<EstimatedStock>;
    estimatedDispatch: () => Promise<EstimatedDispatch>;
    tokenize: () => Promise<Array<TokenSurrogate>>;
    tokenMetadata: (chainTokenId: string) => Promise<any>;
  }>;
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
  findToken: (query: { tokenId: string }, options?: FindOptions) => Promise<TokenSurrogate>;
  findTokensForUser: (user: User, options?: FindOptions) => Promise<Array<TokenSurrogate>>;
  findTokens: (query: any, options?: FindOptions) => Promise<Array<TokenSurrogate>>;
  findProviders: (
    query: WarehousingProviderQuery,
    options?: FindOptions,
  ) => Promise<Array<WarehousingProvider>>;
  count: (query: WarehousingProviderQuery) => Promise<number>;
  providerExists: (query: { warehousingProviderId: string }) => Promise<boolean>;

  // Adapter

  findSupported: (
    warehousingContext: WarehousingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<WarehousingProvider>>;
  findInterface: (query: WarehousingProvider) => WarehousingInterface;
  findInterfaces: (query: WarehousingProviderQuery) => Array<WarehousingInterface>;
  configurationError: (
    provider: WarehousingProvider,
    unchainedAPI: UnchainedCore,
  ) => Promise<WarehousingError>;
  isActive: (provider: WarehousingProvider, unchainedAPI: UnchainedCore) => Promise<boolean>;

  estimatedDispatch: (
    provider: WarehousingProvider,
    context: WarehousingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<EstimatedDispatch>;

  estimatedStock: (
    provider: WarehousingProvider,
    context: WarehousingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<EstimatedStock>;

  updateTokenOwnership: (input: {
    tokenId: string;
    userId: string;
    walletAddress: string;
  }) => Promise<void>;

  tokenizeItems: (
    order: Order,
    params: {
      items: Array<{
        orderPosition: OrderPosition;
        product: Product;
      }>;
    },
    unchainedAPI: UnchainedCore,
  ) => Promise<void>;

  tokenMetadata: (
    chainTokenId: string,
    params: { product: Product; token: TokenSurrogate; referenceDate: Date; locale: Locale },
    unchainedAPI: UnchainedCore,
  ) => Promise<any>;

  // Mutations
  delete: (providerId: string) => Promise<WarehousingProvider>;
};

export type HelperType<P, T> = (provider: WarehousingProvider, params: P, context: UnchainedCore) => T;

export interface WarehousingProviderHelperTypes {
  configurationError: HelperType<never, Promise<WarehousingError>>;
  interface: HelperType<never, WarehousingInterface>;
  isActive: HelperType<never, Promise<boolean>>;
}
