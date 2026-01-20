import { BaseDirector, type IBaseDirector } from '@unchainedshop/utils';
import {
  type DeliveryAdapterActions,
  type DeliveryContext,
  type IDeliveryAdapter,
  DeliveryError,
  DeliveryAdapter,
} from './DeliveryAdapter.ts';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import { type Order, OrderDeliveryStatus } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { createLogger } from '@unchainedshop/logger';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

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

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(DeliveryAdapter.adapterType!) as IDeliveryAdapter[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: ({ adapterFilter } = {}) => {
    const adapters = pluginRegistry.getAdapters(DeliveryAdapter.adapterType!) as IDeliveryAdapter[];
    return adapters.filter(adapterFilter || (() => true));
  },

  actions: async (deliveryProvider, deliveryContext, unchainedAPI) => {
    const Adapter = DeliveryDirector.getAdapter(deliveryProvider.adapterKey);

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
