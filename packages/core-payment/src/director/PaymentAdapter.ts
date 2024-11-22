import { log, LogLevel } from '@unchainedshop/logger';
import { PaymentError } from './PaymentError.js';
import { IPaymentAdapter } from '../types.js';

export const PaymentAdapter: Omit<IPaymentAdapter, 'key' | 'label' | 'version'> = {
  initialConfiguration: [],

  typeSupported: () => {
    return false;
  },

  actions: () => {
    return {
      configurationError: () => {
        return PaymentError.NOT_IMPLEMENTED;
      },

      isActive: () => {
        return false;
      },

      isPayLaterAllowed: () => {
        return false;
      },

      charge: async () => {
        // if you return true, the status will be changed to PAID

        // if you return false, the order payment status stays the
        // same but the order status might change

        // if you throw an error, you cancel the checkout process
        return false;
      },

      register: async () => {
        return {
          token: '',
        };
      },

      sign: async () => {
        return null;
      },

      validate: async () => {
        return false;
      },

      cancel: async () => {
        return false;
      },

      confirm: async () => {
        return false;
      },
    };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
