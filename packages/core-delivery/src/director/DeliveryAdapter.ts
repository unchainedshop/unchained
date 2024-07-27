import { log, LogLevel } from '@unchainedshop/logger';
import { DeliveryError } from './DeliveryError.js';
import { IDeliveryAdapter } from '../types.js';

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
