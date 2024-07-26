import type { Filter, FindOptions } from 'mongodb';
import { ModuleMutationsWithReturnDoc, UnchainedCore } from './core.js';
import { Order } from './orders.js';
import { OrderPayment } from './orders.payments.js';
import {
  IPaymentPricingSheet,
  PaymentPricingCalculation,
  PaymentPricingContext,
} from './payments.pricing.js';
import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import type { TimestampFields } from '@unchainedshop/mongodb';

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

export type PaymentModule = {
  /*
   * Payment Providers Module
   */

  registerCredentials: (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<PaymentCredentials>;

  paymentProviders: ModuleMutationsWithReturnDoc<PaymentProvider> & {
    // Queries
    count: (query: Filter<PaymentProvider>) => Promise<number>;
    findProvider: (
      query: Filter<PaymentProvider> & {
        paymentProviderId: string;
      },
      options?: FindOptions,
    ) => Promise<PaymentProvider>;
    findProviders: (
      query: Filter<PaymentProvider>,
      options?: FindOptions,
    ) => Promise<Array<PaymentProvider>>;

    providerExists: (query: { paymentProviderId: string }) => Promise<boolean>;

    // Payment adapter
    findSupported: (
      query: { order: Order },
      unchainedAPI: UnchainedCore,
    ) => Promise<Array<PaymentProvider>>;
    determineDefault: (
      paymentProviders: Array<PaymentProvider>,
      params: { order: Order; paymentCredentials?: Array<PaymentCredentials> },
      unchainedAPI: UnchainedCore,
    ) => Promise<PaymentProvider>;

    findInterface: (query: PaymentProvider) => PaymentInterface;
    findInterfaces: (query: { type: PaymentProviderType }) => Array<PaymentInterface>;

    pricingSheet: (params: {
      calculation: Array<PaymentPricingCalculation>;
      currency: string;
    }) => IPaymentPricingSheet;

    configurationError: (
      paymentProvider: PaymentProvider,
      unchainedAPI: UnchainedCore,
    ) => Promise<PaymentError>;

    isActive: (paymentProvider: PaymentProvider, unchainedAPI: UnchainedCore) => Promise<boolean>;

    isPayLaterAllowed: (
      paymentProvider: PaymentProvider,
      unchainedAPI: UnchainedCore,
    ) => Promise<boolean>;

    calculate: (
      pricingContext: PaymentPricingContext,
      unchainedAPI: UnchainedCore,
    ) => Promise<Array<PaymentPricingCalculation>>;

    charge: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      unchainedAPI: UnchainedCore,
    ) => Promise<PaymentChargeActionResult | false>;
    register: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      unchainedAPI: UnchainedCore,
    ) => Promise<any>;
    sign: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      unchainedAPI: UnchainedCore,
    ) => Promise<string>;
    validate: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      unchainedAPI: UnchainedCore,
    ) => Promise<boolean>;
    cancel: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      unchainedAPI: UnchainedCore,
    ) => Promise<boolean>;
    confirm: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      unchainedAPI: UnchainedCore,
    ) => Promise<boolean>;
  };

  /*
   * Payment Credentials Module
   */

  paymentCredentials: {
    // Queries

    credentialsExists: (query: { paymentCredentialsId: string }) => Promise<boolean>;

    findPaymentCredential: (
      query: {
        paymentCredentialsId?: string;
        userId?: string;
        paymentProviderId?: string;
        isPreferred?: boolean;
      },
      options?: FindOptions,
    ) => Promise<PaymentCredentials>;

    findPaymentCredentials: (
      query: Filter<PaymentCredentials>,
      options?: FindOptions,
    ) => Promise<Array<PaymentCredentials>>;

    // Mutations
    markPreferred: (query: { userId: string; paymentCredentialsId: string }) => Promise<void>;

    upsertCredentials: (
      doc: Pick<PaymentCredentials, 'userId' | 'paymentProviderId' | '_id' | 'token'> & {
        [x: string]: any;
      },
    ) => Promise<string | null>;

    removeCredentials: (paymentCredentialsId: string) => Promise<PaymentCredentials>;
  };
};

/*
 * Settings
 */

export type FilterProviders = (
  params: {
    providers: Array<PaymentProvider>;
    order: Order;
  },
  context: UnchainedCore,
) => Promise<Array<PaymentProvider>>;

export type DetermineDefaultProvider = (
  params: {
    providers: Array<PaymentProvider>;
    order: Order;
    paymentCredentials?: Array<PaymentCredentials>;
  },
  context: UnchainedCore,
) => Promise<PaymentProvider>;
export interface PaymentSettingsOptions {
  sortProviders?: (a: PaymentProvider, b: PaymentProvider) => number;
  filterSupportedProviders?: FilterProviders;
  determineDefaultProvider?: DetermineDefaultProvider;
}

export interface PaymentSettings {
  filterSupportedProviders: FilterProviders;
  determineDefaultProvider: DetermineDefaultProvider;
  configureSettings: (options?: PaymentSettingsOptions) => void;
}
