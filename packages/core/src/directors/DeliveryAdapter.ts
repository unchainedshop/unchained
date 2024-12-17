import { log, LogLevel } from '@unchainedshop/logger';
import { IBaseAdapter } from '@unchainedshop/utils';
import type { Order, OrderPosition, OrderDelivery } from '@unchainedshop/core-orders';
import type { Product } from '@unchainedshop/core-products';
import type { WarehousingProvider } from '@unchainedshop/core-warehousing';
import type { Work } from '@unchainedshop/core-worker';
import type { User } from '@unchainedshop/core-users';
import {
  DeliveryConfiguration,
  DeliveryLocation,
  DeliveryProvider,
  DeliveryProviderType,
} from '@unchainedshop/core-delivery';
import { Modules } from '../modules.js';

export enum DeliveryError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
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

export type IDeliveryAdapter = IBaseAdapter & {
  initialConfiguration: DeliveryConfiguration;

  typeSupported: (type: DeliveryProviderType) => boolean;

  actions: (
    config: DeliveryConfiguration,
    context: DeliveryContext & { modules: Modules },
  ) => DeliveryAdapterActions;
};

export const DeliveryAdapter: Omit<IDeliveryAdapter, 'key' | 'label' | 'version'> = {
  initialConfiguration: [],

  typeSupported: () => {
    return false;
  },

  actions: () => {
    return {
      configurationError: () => {
        return DeliveryError.NOT_IMPLEMENTED;
      },

      estimatedDeliveryThroughput: async () => {
        return 0;
      },

      isActive: () => {
        return false;
      },

      isAutoReleaseAllowed: () => {
        // if you return false here,
        // the order will need manual confirmation before
        // unchained will try to invoke send()
        return true;
      },

      send: async () => {
        // if you return true, the status will be changed to DELIVERED

        // if you return false, the order delivery status stays the
        // same but the order status might change

        // if you throw an error, you cancel the whole checkout process
        return false;
      },

      pickUpLocationById: async () => {
        return null;
      },

      pickUpLocations: async () => {
        return [];
      },
    };
  },

  log: (message: string, { level = LogLevel.Debug, ...options } = {}) => {
    return log(message, { level, ...options });
  },
};
