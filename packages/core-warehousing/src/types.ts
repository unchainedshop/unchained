import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import { TimestampFields } from '@unchainedshop/mongodb';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Product } from '@unchainedshop/core-products';
import type { Order, OrderPosition } from '@unchainedshop/core-orders';

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
  invalidatedDate?: Date;
  expiryDate?: Date;
  quantity: number;
  contractAddress: string;
  chainId: string;
  chainTokenId: string;
  productId: string;
  orderPositionId: string;
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
  locale?: Intl.Locale;
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
  tokenize: () => Promise<Array<Omit<TokenSurrogate, 'userId' | 'productId' | 'orderPositionId'>>>;
  tokenMetadata: (chainTokenId: string, referenceDate: Date) => Promise<any>;
  isInvalidateable: (chainTokenId: string, referenceDate: Date) => Promise<boolean>;
};

export type IWarehousingAdapter = IBaseAdapter & {
  orderIndex: number;
  initialConfiguration: WarehousingConfiguration;
  typeSupported: (type: WarehousingProviderType) => boolean;

  actions: (config: WarehousingConfiguration, context: WarehousingContext) => WarehousingAdapterActions;
};

export type IWarehousingDirector = IBaseDirector<IWarehousingAdapter> & {
  actions: (
    warehousingProvider: WarehousingProvider,
    warehousingContext: WarehousingContext,
    unchainedAPI,
  ) => Promise<{
    configurationError: () => WarehousingError;
    isActive: () => boolean;
    estimatedStock: () => Promise<EstimatedStock>;
    estimatedDispatch: () => Promise<EstimatedDispatch>;
    tokenize: () => Promise<Array<TokenSurrogate>>;
    tokenMetadata: (chainTokenId: string) => Promise<any>;
    isInvalidateable: (chainTokenId: string) => Promise<boolean>;
  }>;
};

export interface WarehousingInterface {
  _id: string;
  label: string;
  version: string;
}
