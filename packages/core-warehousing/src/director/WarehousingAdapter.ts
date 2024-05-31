import { IWarehousingAdapter } from '@unchainedshop/types/warehousing.js';
import { log, LogLevel } from '@unchainedshop/logger';

import { WarehousingError } from './WarehousingError.js';

export const WarehousingAdapter: Omit<IWarehousingAdapter, 'key' | 'label' | 'version'> = {
  orderIndex: 0,

  typeSupported: () => {
    return false;
  },

  initialConfiguration: [],

  actions: () => {
    return {
      configurationError: () => WarehousingError.NOT_IMPLEMENTED,

      isActive: () => false,

      stock: async () => 0,

      productionTime: async () => 0,

      commissioningTime: async () => 0,

      tokenize: async () => [],

      tokenMetadata: async () => ({}),

      isInvalidateable: async () => true,
    };
  },

  log(message, { level = LogLevel.Debug, ...options } = {}) {
    // eslint-disable-line
    return log(message, { level, ...options });
  },
};
