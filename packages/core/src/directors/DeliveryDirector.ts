import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import {
  DeliveryAdapterActions,
  DeliveryContext,
  IDeliveryAdapter,
  DeliveryError,
} from './DeliveryAdapter.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Order, OrderDeliveryStatus } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

export type IDeliveryDirector = IBaseDirector<IDeliveryAdapter> & {
  sendOrderDelivery: (
    order: Order,
    transactionContext: Record<string, any>,
    unchainedAPI: { modules: Modules },
  ) => Promise<void>;
  actions: (
    deliveryProvider: DeliveryProvider,
    deliveryContext: DeliveryContext,
    unchainedAPI: { modules: Modules },
  ) => Promise<DeliveryAdapterActions>;
};

const baseDirector = BaseDirector<IDeliveryAdapter>('DeliveryDirector');

export const DeliveryDirector: IDeliveryDirector = {
  ...baseDirector,

  actions: async (deliveryProvider, deliveryContext, unchainedAPI) => {
    const Adapter = baseDirector.getAdapter(deliveryProvider.adapterKey);

    if (!Adapter) {
      throw new Error(`Delivery Plugin ${deliveryProvider.adapterKey} not available`);
    }

    const context = { ...deliveryContext, ...unchainedAPI, deliveryProvider };
    const adapter = Adapter.actions(deliveryProvider.configuration, context);

    return {
      configurationError: () => {
        if (!adapter) {
          return DeliveryError.ADAPTER_NOT_FOUND;
        }
        return adapter.configurationError();
      },

      estimatedDeliveryThroughput: async (warehousingThroughputTime) => {
        try {
          const throughput = await adapter?.estimatedDeliveryThroughput(warehousingThroughputTime);
          return throughput;
        } catch (error) {
          logger.warn('Delivery Director -> Error while estimating delivery throughput', {
            ...error,
          });
          return null;
        }
      },

      isActive: () => {
        if (!adapter) return false;
        try {
          return adapter.isActive();
        } catch (error) {
          logger.warn('Delivery Director -> Error while checking if is active', {
            ...error,
          });
          return false;
        }
      },

      isAutoReleaseAllowed: () => {
        if (!adapter) return false;
        try {
          return adapter.isAutoReleaseAllowed();
        } catch (error) {
          logger.warn('Delivery Director -> Error while checking if auto release is allowed', {
            ...error,
          });
          return false;
        }
      },

      send: async () => {
        if (!adapter) throw new Error('Delivery adapter not found');
        return adapter.send();
      },

      pickUpLocationById: async (locationId) => {
        if (!adapter) throw new Error('Delivery adapter not found');
        return adapter?.pickUpLocationById(locationId);
      },

      pickUpLocations: async () => {
        if (!adapter) throw new Error('Delivery adapter not found');
        return adapter.pickUpLocations();
      },
    };
  },

  sendOrderDelivery: async (order, transactionContext, unchainedAPI) => {
    const orderDelivery = await unchainedAPI.modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId!,
    });

    if (
      unchainedAPI.modules.orders.deliveries.normalizedStatus(orderDelivery!) !==
      OrderDeliveryStatus.OPEN
    )
      return;

    const deliveryProvider = await unchainedAPI.modules.delivery.findProvider({
      deliveryProviderId: orderDelivery!.deliveryProviderId,
    });

    const address = orderDelivery!.context?.address || order!.billingAddress;

    const adapter = await DeliveryDirector.actions(
      deliveryProvider!,
      {
        order: order!,
        orderDelivery: orderDelivery!,
        transactionContext: {
          ...(transactionContext || {}),
          ...(orderDelivery!.context || {}),
          ...(address || {}),
        },
      },
      unchainedAPI,
    );

    const arbitraryResponseData = await adapter.send();
    if (arbitraryResponseData) {
      await unchainedAPI.modules.orders.deliveries.updateStatus(orderDelivery!._id, {
        status: OrderDeliveryStatus.DELIVERED,
        info: JSON.stringify(arbitraryResponseData),
      });
    }
  },
};
