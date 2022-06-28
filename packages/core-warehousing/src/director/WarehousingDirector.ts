import {
  IWarehousingAdapter,
  IWarehousingDirector,
  WarehousingContext,
} from '@unchainedshop/types/warehousing';
import { DeliveryDirector } from 'meteor/unchained:core-delivery';
import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector } from '@unchainedshop/utils';
import { WarehousingError } from './WarehousingError';

const getReferenceDate = (context: WarehousingContext) => {
  return context && context.referenceDate ? context.referenceDate : new Date();
};

const baseDirector = BaseDirector<IWarehousingAdapter>('WarehousingDirector', {
  adapterSortKey: 'orderIndex',
});

export const WarehousingDirector: IWarehousingDirector = {
  ...baseDirector,

  actions: async (warehousingProvider, warehousingContext, requestContext) => {
    const Adapter = baseDirector.getAdapter(warehousingProvider.adapterKey);

    if (!Adapter) {
      throw new Error(`Payment Plugin ${warehousingProvider.adapterKey} not available`);
    }
    const context = {
      warehousingProviderId: warehousingProvider._id,
      ...warehousingContext,
      ...requestContext,
    };
    const adapter = Adapter.actions(warehousingProvider.configuration, context);

    const throughputTime = async () => {
      try {
        const { quantity } = context;
        const referenceDate = getReferenceDate(context);
        const stock = (await adapter.stock(referenceDate).catch(() => 0)) || 0;
        const notInStockQuantity = Math.max(quantity - stock, 0);
        const productionTime = await adapter.productionTime(notInStockQuantity);
        const commissioningTime = await adapter.commissioningTime(quantity);
        return Math.max(commissioningTime + productionTime, 0);
      } catch (error) {
        log(error.message, { level: LogLevel.Error, ...error });
        return 0;
      }
    };

    return {
      configurationError: () => {
        try {
          const error = adapter.configurationError();
          return error;
        } catch (error) {
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
          const warehousingThroughputTime = await throughputTime();

          const actions = await DeliveryDirector.actions(deliveryProvider, context, requestContext);
          const deliveryThroughputTime = await actions.estimatedDeliveryThroughput(
            warehousingThroughputTime,
          );

          const shippingTimestamp = referenceDate.getTime() + warehousingThroughputTime;
          const earliestDeliveryTimestamp =
            deliveryThroughputTime !== null ? shippingTimestamp + deliveryThroughputTime : null;

          return {
            shipping: shippingTimestamp && new Date(shippingTimestamp),
            earliestDelivery: earliestDeliveryTimestamp && new Date(earliestDeliveryTimestamp),
          };
        } catch (error) {
          log(error.message, { level: LogLevel.Error, ...error });
          return {};
        }
      },
    };
  },
};
