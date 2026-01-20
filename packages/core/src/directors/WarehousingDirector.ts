import type { IBaseDirector } from '@unchainedshop/utils';
import { BaseDirector } from '@unchainedshop/utils';
import type { WarehousingProvider, TokenSurrogate } from '@unchainedshop/core-warehousing';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

import { DeliveryDirector } from './DeliveryDirector.ts';
import {
  type IWarehousingAdapter,
  type WarehousingContext,
  WarehousingError,
  WarehousingAdapter,
} from './WarehousingAdapter.ts';
import type { Modules } from '../modules.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

export interface EstimatedDispatch {
  shipping?: Date;
  earliestDelivery?: Date;
}

export type EstimatedStock = { quantity: number } | null;

export interface WarehousingInterface {
  _id: string;
  label: string;
  version: string;
}

export type IWarehousingDirector = IBaseDirector<IWarehousingAdapter> & {
  tokenMetadata: (
    virtualProviders: WarehousingProvider[],
    warehousingContext: WarehousingContext & { token: { tokenSerialNumber: string } },
    unchainedAPI,
  ) => Promise<any>;

  isInvalidateable: (
    virtualProviders: WarehousingProvider[],
    warehousingContext: WarehousingContext & { token: { tokenSerialNumber: string } },
    unchainedAPI,
  ) => Promise<any>;

  actions: (
    warehousingProvider: WarehousingProvider,
    warehousingContext: WarehousingContext,
    unchainedAPI: { modules: Modules },
  ) => Promise<{
    configurationError: () => WarehousingError | null;
    isActive: () => boolean;
    estimatedStock: () => Promise<EstimatedStock>;
    estimatedDispatch: () => Promise<EstimatedDispatch>;
    tokenize: () => Promise<TokenSurrogate[]>;
    tokenMetadata: (tokenSerialNumber: string) => Promise<any>;
    isInvalidateable: (tokenSerialNumber: string) => Promise<boolean>;
  }>;
};

const getReferenceDate = (context: WarehousingContext) => {
  return context && context.referenceDate ? context.referenceDate : new Date();
};

const baseDirector = BaseDirector<IWarehousingAdapter>('WarehousingDirector', {
  adapterSortKey: 'orderIndex',
});

export const WarehousingDirector: IWarehousingDirector = {
  ...baseDirector,

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(
      WarehousingAdapter.adapterType!,
    ) as IWarehousingAdapter[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: ({ adapterFilter } = {}) => {
    const adapters = pluginRegistry.getAdapters(
      WarehousingAdapter.adapterType!,
    ) as IWarehousingAdapter[];
    return adapters.filter(adapterFilter || (() => true));
  },

  actions: async (warehousingProvider, warehousingContext, unchainedAPI) => {
    const Adapter = WarehousingDirector.getAdapter(warehousingProvider.adapterKey);

    if (!Adapter) {
      throw new Error(`Warehousing Plugin ${warehousingProvider.adapterKey} not available`);
    }
    const context = {
      warehousingProviderId: warehousingProvider._id,
      ...warehousingContext,
      ...unchainedAPI,
    };
    const adapter = Adapter.actions(warehousingProvider.configuration, context);

    const throughputTime = async (referenceDate) => {
      try {
        const { quantity } = context;
        const stock = await adapter.stock(referenceDate);
        const notInStockQuantity = Math.max((quantity || 1) - stock, 0);
        const productionTime = await adapter.productionTime(notInStockQuantity);
        const commissioningTime = await adapter.commissioningTime(quantity || 1);
        return Math.max(commissioningTime + productionTime, 0);
      } catch (error) {
        logger.error(error);
        return NaN;
      }
    };

    return {
      configurationError: () => {
        try {
          const error = adapter.configurationError();
          return error;
        } catch {
          return WarehousingError.ADAPTER_NOT_FOUND;
        }
      },

      isActive: () => {
        try {
          return adapter.isActive();
        } catch (error) {
          logger.error(error);
          return false;
        }
      },

      estimatedStock: async () => {
        try {
          const referenceDate = getReferenceDate(context);
          const quantity = await adapter.stock(referenceDate);
          return {
            quantity,
          };
        } catch (error) {
          logger.error(error);
          return null;
        }
      },

      estimatedDispatch: async () => {
        try {
          const { deliveryProvider } = context;
          const referenceDate = getReferenceDate(context);

          const warehousingThroughputTime = await throughputTime(referenceDate);
          if (!Number.isFinite(warehousingThroughputTime)) {
            return {};
          }

          // Calculate shipping date
          const shippingTimestamp = referenceDate.getTime() + warehousingThroughputTime;
          const shipping = new Date(shippingTimestamp);

          // Calculate earliest delivery date
          const actions = await DeliveryDirector.actions(deliveryProvider!, context, unchainedAPI);
          const deliveryThroughputTime =
            await actions.estimatedDeliveryThroughput(warehousingThroughputTime);
          const earliestDelivery = Number.isFinite(deliveryThroughputTime)
            ? new Date(shippingTimestamp + deliveryThroughputTime!)
            : undefined;

          return {
            shipping,
            earliestDelivery,
          };
        } catch (error) {
          logger.error(error);
          return {};
        }
      },

      tokenMetadata: async (tokenSerialNumber) => {
        try {
          const referenceDate = getReferenceDate(context);
          const tokenMetadata = await adapter.tokenMetadata(tokenSerialNumber, referenceDate);
          return tokenMetadata;
        } catch (error) {
          logger.error(error);
          return {};
        }
      },

      isInvalidateable: async (tokenSerialNumber) => {
        try {
          const referenceDate = getReferenceDate(context);
          const isInvalidateable = await adapter.isInvalidateable(tokenSerialNumber, referenceDate);
          return isInvalidateable;
        } catch (error) {
          logger.error(error);
          return false;
        }
      },

      tokenize: async () => {
        try {
          const tokens = await adapter.tokenize();
          const { order, orderPosition } = warehousingContext;
          return tokens.map((token) => {
            return {
              ...token,
              userId: order!.userId,
              productId: orderPosition!.productId,
              orderPositionId: orderPosition!._id,
            };
          });
        } catch (error) {
          logger.error(error);
          return [];
        }
      },
    };
  },

  async tokenMetadata(virtualProviders, warehousingContext, unchainedAPI) {
    return virtualProviders.reduce(async (lastPromise, provider) => {
      const last = await lastPromise;
      if (last) return last;
      const currentDirector = await WarehousingDirector.actions(
        provider,
        warehousingContext,
        unchainedAPI,
      );
      const isActive = await currentDirector.isActive();
      if (isActive) {
        return currentDirector.tokenMetadata(warehousingContext.token.tokenSerialNumber);
      }
      return null;
    }, Promise.resolve(null));
  },

  async isInvalidateable(virtualProviders, warehousingContext, unchainedAPI) {
    return virtualProviders.reduce(async (lastPromise, provider) => {
      const last = await lastPromise;
      if (last) return last;
      const currentDirector = await WarehousingDirector.actions(
        provider,
        warehousingContext,
        unchainedAPI,
      );
      const isActive = await currentDirector.isActive();
      if (isActive) {
        return currentDirector.isInvalidateable(warehousingContext.token.tokenSerialNumber);
      }
      return null;
    }, Promise.resolve(null));
  },
};
