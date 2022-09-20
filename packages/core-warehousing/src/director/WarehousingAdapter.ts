import { IWarehousingAdapter } from '@unchainedshop/types/warehousing';
import { log, LogLevel } from '@unchainedshop/logger';
import { WarehousingError } from './WarehousingError';

export const WarehousingAdapter: Omit<IWarehousingAdapter, 'key' | 'label' | 'version'> = {
  orderIndex: 0,

  typeSupported: () => {
    return false;
  },

  initialConfiguration: [],

  actions: () => {
    return {
      configurationError() {
        return WarehousingError.NOT_IMPLEMENTED;
      },

      isActive() {
        return false;
      },

      stock: async () => {
        return 0;
      },

      productionTime: async () => {
        return 0;
      },

      commissioningTime: async () => {
        return 0;
      },

      tokenize: async () => {
        /* */
      },
    };
  },

  log(message, { level = LogLevel.Debug, ...options } = {}) {
    // eslint-disable-line
    return log(message, { level, ...options });
  },
};
