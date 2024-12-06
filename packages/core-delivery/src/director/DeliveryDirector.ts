import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import {
  DeliveryAdapterActions,
  DeliveryContext,
  IDeliveryAdapter,
  DeliveryError,
} from './DeliveryAdapter.js';
import { DeliveryProvider } from '../db/DeliveryProvidersCollection.js';
import { OrderDelivery, OrderDeliveryStatus } from '@unchainedshop/core-orders';

export type IDeliveryDirector = IBaseDirector<IDeliveryAdapter> & {
  sendOrderDelivery: (
    orderDelivery: OrderDelivery,
    transactionContext: Record<string, any>,
    unchainedAPI,
  ) => Promise<OrderDelivery>;
  actions: (
    deliveryProvider: DeliveryProvider,
    deliveryContext: DeliveryContext,
    unchainedAPI,
  ) => Promise<DeliveryAdapterActions>;
};

const baseDirector = BaseDirector<IDeliveryAdapter>('DeliveryDirector');

export const DeliveryDirector: IDeliveryDirector = {
  ...baseDirector,

  actions: async (deliveryProvider, deliveryContext, unchainedAPI) => {
    const Adapter = baseDirector.getAdapter(deliveryProvider.adapterKey);

    const context = { ...deliveryContext, ...unchainedAPI };
    const adapter = Adapter?.actions(deliveryProvider.configuration, context);

    return {
      configurationError: () => {
        try {
          return adapter.configurationError();
        } catch {
          return DeliveryError.ADAPTER_NOT_FOUND;
        }
      },

      estimatedDeliveryThroughput: async (warehousingThroughputTime) => {
        try {
          const throughput = await adapter.estimatedDeliveryThroughput(warehousingThroughputTime);
          return throughput;
        } catch (error) {
          log('Delivery Director -> Error while estimating delivery throughput', {
            level: LogLevel.Warning,
            ...error,
          });
          return null;
        }
      },

      isActive: () => {
        try {
          return adapter.isActive();
        } catch (error) {
          log('Delivery Director -> Error while checking if is active', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },

      isAutoReleaseAllowed: () => {
        try {
          return adapter.isAutoReleaseAllowed();
        } catch (error) {
          log('Delivery Director -> Error while checking if auto release is allowed', {
            level: LogLevel.Warning,
            ...error,
          });
          return false;
        }
      },

      send: async () => {
        return adapter.send();
      },

      pickUpLocationById: async (locationId) => {
        return adapter.pickUpLocationById(locationId);
      },

      pickUpLocations: async () => {
        return adapter.pickUpLocations();
      },
    };
  },

  sendOrderDelivery: async (orderDelivery, transactionContext, unchainedAPI) => {
    if (unchainedAPI.modules.delivery.normalizedStatus(orderDelivery) !== OrderDeliveryStatus.OPEN)
      return orderDelivery;

    const order = await unchainedAPI.modules.orders.findOrder({ orderId: orderDelivery.orderId });
    const deliveryProvider = await unchainedAPI.modules.delivery.findProvider({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    });
    const deliveryProviderId = deliveryProvider._id;
    const address = orderDelivery.context?.address || order || order.billingAddress;
    const provider = await await unchainedAPI.modules.delivery.findProvider({ deliveryProviderId });

    const adapter = await DeliveryDirector.actions(
      provider,
      {
        order,
        orderDelivery,
        transactionContext: {
          ...(transactionContext || {}),
          ...(orderDelivery.context || {}),
          ...(address || {}),
        },
      },
      unchainedAPI,
    );

    const arbitraryResponseData = await adapter.send();

    if (arbitraryResponseData) {
      return await unchainedAPI.modules.delivery.updateStatus(orderDelivery._id, {
        status: OrderDeliveryStatus.DELIVERED,
        info: JSON.stringify(arbitraryResponseData),
      });
    }

    return orderDelivery;
  },
};
