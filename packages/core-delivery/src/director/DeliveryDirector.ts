import { log, LogLevel } from '@unchainedshop/logger';
import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import {
  DeliveryAdapterActions,
  DeliveryContext,
  IDeliveryAdapter,
  DeliveryError,
} from './DeliveryAdapter.js';
import { DeliveryProvider } from '../db/DeliveryProvidersCollection.js';

export type IDeliveryDirector = IBaseDirector<IDeliveryAdapter> & {
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
};
