import { BaseAdapter } from '@unchainedshop/utils';
import type { IBaseAdapter } from '@unchainedshop/utils';
import type { Order, OrderPayment } from '@unchainedshop/core-orders';
import type {
  PaymentConfiguration,
  PaymentProvider,
  PaymentProviderType,
} from '@unchainedshop/core-payment';
import type { Modules } from '../modules.ts';

export const PaymentError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
} as const;

export type PaymentError = (typeof PaymentError)[keyof typeof PaymentError];

export interface ChargeResult {
  transactionId?: string;
  [key: string]: any;
}

export type PaymentChargeActionResult = ChargeResult & {
  credentials?: {
    token: string;
    [key: string]: any;
  };
};
export interface IPaymentActions {
  charge: (transactionContext?: any) => Promise<PaymentChargeActionResult | false>;
  configurationError: (transactionContext?: any) => PaymentError | null;
  isActive: (transactionContext?: any) => boolean;
  isPayLaterAllowed: (transactionContext?: any) => boolean;
  register: (transactionContext?: any) => Promise<any>;
  sign: (transactionContext?: any) => Promise<string | null>;
  validate: (token?: any) => Promise<boolean>;
  cancel: (transactionContext?: any) => Promise<boolean>;
  confirm: (transactionContext?: any) => Promise<boolean>;
}
export interface PaymentContext {
  userId?: string;
  order?: Order;
  orderPayment?: OrderPayment;
  transactionContext?: any; // Used for signing and charging a payment
  token?: any; // Used for validation
  meta?: any;
}

export type IPaymentAdapter = IBaseAdapter & {
  initialConfiguration: PaymentConfiguration;

  typeSupported: (type: PaymentProviderType) => boolean;

  actions: (
    config: PaymentConfiguration,
    context: PaymentContext & {
      paymentProvider: PaymentProvider;
      modules: Modules;
    },
  ) => IPaymentActions;
};

export const PaymentAdapter: Omit<IPaymentAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
  adapterType: Symbol.for('unchained:adapter:payment'),
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
        // Return charge result data to mark the payment PAID, or false to keep it open.
        // Throw to abort payment processing.
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
};
