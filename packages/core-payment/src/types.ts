import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import type { TimestampFields } from '@unchainedshop/mongodb';
import { Order } from '@unchainedshop/core-orders';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';

export enum PaymentProviderType {
  CARD = 'CARD',
  INVOICE = 'INVOICE',
  GENERIC = 'GENERIC',
}

export type PaymentConfiguration = Array<{
  key: string;
  value: string | null;
}>;

export type PaymentProvider = {
  _id?: string;
  type: PaymentProviderType;
  adapterKey: string;
  configuration: PaymentConfiguration;
} & TimestampFields;

export type PaymentCredentials = {
  _id?: string;
  paymentProviderId: string;
  userId: string;
  token?: string;
  isPreferred?: boolean;
  meta: any;
} & TimestampFields;

export enum PaymentError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export interface PaymentContext {
  userId?: string;
  order?: Order;
  orderPayment?: OrderPayment;
  transactionContext?: any; // User for singing and charging a payment
  token?: any; // Used for validation
  meta?: any;
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

export type IPaymentAdapter = IBaseAdapter & {
  initialConfiguration: PaymentConfiguration;

  typeSupported: (type: PaymentProviderType) => boolean;

  actions: (params: {
    config: PaymentConfiguration;
    paymentContext: PaymentContext & {
      paymentProviderId: string;
      paymentProvider: PaymentProvider;
    };
    context: UnchainedCore;
  }) => IPaymentActions;
};

export type IPaymentDirector = IBaseDirector<IPaymentAdapter> & {
  actions: (
    paymentProvider: PaymentProvider,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<IPaymentActions>;
};

/*
 * Module
 */

export interface PaymentInterface {
  _id: string;
  label: string;
  version: string;
}

/*
 * Settings
 */
