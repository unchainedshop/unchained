import { BaseAdapter, IBaseAdapter } from '@unchainedshop/utils';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Product } from '@unchainedshop/core-products';
import { Order, OrderPosition } from '@unchainedshop/core-orders';
import {
  TokenSurrogate,
  WarehousingConfiguration,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';

export enum WarehousingError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export interface WarehousingAdapterActions {
  configurationError: () => WarehousingError;
  isActive: () => boolean;
  stock: (referenceDate: Date) => Promise<number>;
  productionTime: (quantityToProduce: number) => Promise<number>;
  commissioningTime: (quantity: number) => Promise<number>;
  tokenize: () => Promise<Omit<TokenSurrogate, 'userId' | 'productId' | 'orderPositionId'>[]>;
  tokenMetadata: (chainTokenId: string, referenceDate: Date) => Promise<any>;
  isInvalidateable: (chainTokenId: string, referenceDate: Date) => Promise<boolean>;
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

export type IWarehousingAdapter = IBaseAdapter & {
  orderIndex: number;
  initialConfiguration: WarehousingConfiguration;
  typeSupported: (type: WarehousingProviderType) => boolean;

  actions: (config: WarehousingConfiguration, context: WarehousingContext) => WarehousingAdapterActions;
};

export const WarehousingAdapter: Omit<IWarehousingAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
  orderIndex: 0,

  typeSupported: () => {
    return false;
  },

  initialConfiguration: [],

  actions: () => {
    return {
      configurationError: () => WarehousingError.NOT_IMPLEMENTED,

      isActive: () => false,

      stock: async () => 0,

      productionTime: async () => 0,

      commissioningTime: async () => 0,

      tokenize: async () => [],

      tokenMetadata: async () => ({}),

      isInvalidateable: async () => true,
    };
  },
};
