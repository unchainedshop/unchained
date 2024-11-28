import { IBaseDirector } from '@unchainedshop/utils';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector } from '@unchainedshop/utils';
import { DeliveryDirector } from '@unchainedshop/core-delivery'; // TODO: Important smell!
import { IWarehousingAdapter, WarehousingContext, WarehousingError } from './WarehousingAdapter.js';
import { WarehousingProvider } from '../db/WarehousingProvidersCollection.js';
import { TokenSurrogate } from '../db/TokenSurrogateCollection.js';

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
        log(error.message, { level: LogLevel.Error, ...error });
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
          log(error.message, { level: LogLevel.Error });
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
          log(error.message, { level: LogLevel.Error, ...error });
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
          log(error.message, { level: LogLevel.Error, ...error });
          return {};
        }
      },

      tokenMetadata: async (chainTokenId) => {
        try {
          const referenceDate = getReferenceDate(context);
          const tokenMetadata = await adapter.tokenMetadata(chainTokenId, referenceDate);
          return tokenMetadata;
        } catch (error) {
          log(error.message, { level: LogLevel.Error, ...error });
          return {};
        }
      },

      isInvalidateable: async (chainTokenId) => {
        try {
          const referenceDate = getReferenceDate(context);
          const isInvalidateable = await adapter.isInvalidateable(chainTokenId, referenceDate);
          return isInvalidateable;
        } catch (error) {
          log(error.message, { level: LogLevel.Error, ...error });
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
          log(error.message, { level: LogLevel.Error, ...error });
          return [];
        }
      },
    };
  },
};
