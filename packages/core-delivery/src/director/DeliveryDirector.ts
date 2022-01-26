import {
  IDeliveryAdapter,
  IDeliveryDirector,
} from '@unchainedshop/types/delivery';
import { BaseDirector } from 'meteor/unchained:utils';
import { DeliveryError } from './DeliveryError';

const baseDirector = BaseDirector<IDeliveryAdapter>('DeliveryDirector');

export const DeliveryDirector: IDeliveryDirector = {
  ...baseDirector,

  actions: (deliveryProvider, deliveryContext, requestContext) => {
    const Adapter = baseDirector.getAdapter(deliveryProvider.adapterKey);

    const context = { ...deliveryContext, ...requestContext };
    const adapter = Adapter.actions(deliveryProvider.configuration, context);

    return {
      configurationError: () => {
        try {
          const error = adapter.configurationError();
          return error;
        } catch (error) {
          return DeliveryError.ADAPTER_NOT_FOUND;
        }
      },

      estimatedDeliveryThroughput: async (warehousingThroughputTime) => {
        try {
          return adapter.estimatedDeliveryThroughput(warehousingThroughputTime);
        } catch (error) {
          console.warn(error);
          return null;
        }
      },

      isActive: () => {
        try {
          return adapter.isActive();
        } catch (error) {
          console.warn(error);
          return false;
        }
      },

      isAutoReleaseAllowed: () => {
        try {
          return adapter.isAutoReleaseAllowed();
        } catch (error) {
          console.warn(error);
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
