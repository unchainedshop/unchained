import { log, LogLevel } from '@unchainedshop/logger';
import { IBaseAdapter } from '@unchainedshop/utils';
import type { Order, OrderPayment } from '@unchainedshop/core-orders';

import {
  PaymentConfiguration,
  PaymentProvider,
  PaymentProviderType,
} from '../db/PaymentProvidersCollection.js';

export enum PaymentError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export type ChargeResult = {
  transactionId?: string;
  [key: string]: any;
};

export type PaymentChargeActionResult = ChargeResult & {
  credentials?: {
    token: string;
    [key: string]: any;
  };
};
export interface IPaymentActions {
  charge: (transactionContext?: any) => Promise<PaymentChargeActionResult | false>;
  configurationError: (transactionContext?: any) => PaymentError;
  isActive: (transactionContext?: any) => boolean;
  isPayLaterAllowed: (transactionContext?: any) => boolean;
  register: (transactionContext?: any) => Promise<any>;
  sign: (transactionContext?: any) => Promise<string>;
  validate: (token?: any) => Promise<boolean>;
  cancel: (transactionContext?: any) => Promise<boolean>;
  confirm: (transactionContext?: any) => Promise<boolean>;
}
export interface PaymentContext {
  userId?: string;
  order?: Order;
  orderPayment?: OrderPayment;
  transactionContext?: any; // User for singing and charging a payment
  token?: any; // Used for validation
  meta?: any;
}

export type IPaymentAdapter<UnchainedAPI = unknown> = IBaseAdapter & {
  initialConfiguration: PaymentConfiguration;

  typeSupported: (type: PaymentProviderType) => boolean;

  actions: (
    config: PaymentConfiguration,
    context: PaymentContext & {
      paymentProviderId: string;
      paymentProvider: PaymentProvider;
    } & UnchainedAPI,
  ) => IPaymentActions;
};

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
