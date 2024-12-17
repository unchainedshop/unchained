import { IBaseDirector, BaseDirector } from '@unchainedshop/utils';
import { WarehousingProvider, TokenSurrogate } from '@unchainedshop/core-warehousing';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

import {
  DeliveryDirector,
  IWarehousingAdapter,
  WarehousingContext,
  WarehousingError,
} from '../directors/index.js';

export type EstimatedDispatch = {
  shipping?: Date;
  earliestDelivery?: Date;
};

export type EstimatedStock = { quantity: number } | null;

export interface WarehousingInterface {
  _id: string;
  label: string;
  version: string;
}

export type IWarehousingDirector = IBaseDirector<IWarehousingAdapter> & {
  tokenMetadata: (
    virtualProviders: WarehousingProvider[],
    warehousingContext: WarehousingContext & { token: { chainTokenId: string } },
    unchainedAPI,
  ) => Promise<any>;

  isInvalidateable: (
    virtualProviders: WarehousingProvider[],
    warehousingContext: WarehousingContext & { token: { chainTokenId: string } },
    unchainedAPI,
  ) => Promise<any>;

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

const getReferenceDate = (context: WarehousingContext) => {
  return context && context.referenceDate ? context.referenceDate : new Date();
};

const baseDirector = BaseDirector<IWarehousingAdapter>('WarehousingDirector', {
  adapterSortKey: 'orderIndex',
});

export const WarehousingDirector: IWarehousingDirector = {
  ...baseDirector,

  actions: async (warehousingProvider, warehousingContext, unchainedAPI) => {
    const Adapter = baseDirector.getAdapter(warehousingProvider.adapterKey);

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
        const notInStockQuantity = Math.max(quantity - stock, 0);
        const productionTime = await adapter.productionTime(notInStockQuantity);
        const commissioningTime = await adapter.commissioningTime(quantity);
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
            return {
              shipping: null,
              earliestDelivery: null,
            };
          }

          // Calculate shipping date
          const shippingTimestamp = referenceDate.getTime() + warehousingThroughputTime;
          const shipping = new Date(shippingTimestamp);

          // Calculate earliest delivery date
          const actions = await DeliveryDirector.actions(deliveryProvider, context, unchainedAPI);
          const deliveryThroughputTime =
            await actions.estimatedDeliveryThroughput(warehousingThroughputTime);
          const earliestDelivery = Number.isFinite(deliveryThroughputTime)
            ? new Date(shippingTimestamp + deliveryThroughputTime)
            : null;

          return {
            shipping,
            earliestDelivery,
          };
        } catch (error) {
          logger.error(error);
          return {};
        }
      },

      tokenMetadata: async (chainTokenId) => {
        try {
          const referenceDate = getReferenceDate(context);
          const tokenMetadata = await adapter.tokenMetadata(chainTokenId, referenceDate);
          return tokenMetadata;
        } catch (error) {
          logger.error(error);
          return {};
        }
      },

      isInvalidateable: async (chainTokenId) => {
        try {
          const referenceDate = getReferenceDate(context);
          const isInvalidateable = await adapter.isInvalidateable(chainTokenId, referenceDate);
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
              userId: order.userId,
              productId: orderPosition.productId,
              orderPositionId: orderPosition._id,
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
        return currentDirector.tokenMetadata(warehousingContext.token.chainTokenId);
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
        return currentDirector.isInvalidateable(warehousingContext.token.chainTokenId);
      }
      return null;
    }, Promise.resolve(null));
  },
};
