import { Context } from './api';
import {
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  ModuleMutationsWithReturnDoc,
  Query,
  TimestampFields,
  _ID,
} from './common';
import { Order } from './orders';
import { OrderPayment } from './orders.payments';
import { PaymentPricingCalculation, PaymentPricingContext } from './payments.pricing';
import { User } from './user';

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
  _id?: _ID;
  type: PaymentProviderType;
  adapterKey: string;
  authorId: string;
  configuration: PaymentConfiguration;
} & TimestampFields;

export type PaymentCredentials = {
  _id?: _ID;
  paymentProviderId: string;
  userId: string;
  token?: string;
  isPreferred?: boolean;
  meta: any;
} & TimestampFields;

type PaymentProviderQuery = {
  type?: PaymentProviderType;
  deleted?: Date;
};

export enum PaymentError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export interface PaymentContext {
  userId?: string;
  paymentProviderId?: string;
  order?: Order;
  orderPayment?: OrderPayment;
  transactionContext?: any; // User for singing and charging a payment
  token?: any; // Used for validation
  meta?: any;
}

interface IPaymentActions {
  charge: (transactionContext?: any) => Promise<any>;
  configurationError: (transactionContext?: any) => Promise<PaymentError>;
  isActive: (transactionContext?: any) => Promise<boolean>;
  isPayLaterAllowed: (transactionContext?: any) => boolean;
  register: (transactionContext?: any) => Promise<any>;
  sign: (transactionContext?: any) => Promise<string>;
  validate: (token?: any) => Promise<boolean>;
  cancel: (transactionContext?: any) => Promise<boolean>;
}

export type IPaymentAdapter = IBaseAdapter & {
  initialConfiguration: PaymentConfiguration;

  typeSupported: (type: PaymentProviderType) => boolean;

  actions: (params: {
    config: PaymentConfiguration;
    paymentContext: PaymentContext;
    context: Context;
  }) => IPaymentActions;
};

export type IPaymentDirector = IBaseDirector<IPaymentAdapter> & {
  actions: (
    paymentProvider: PaymentProvider,
    paymentContext: PaymentContext,
    requestContext: Context,
  ) => IPaymentActions;
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

  paymentProviders: ModuleMutationsWithReturnDoc<PaymentProvider> & {
    // Queries
    count: (query: PaymentProviderQuery) => Promise<number>;
    findProvider: (
      query: Query & {
        paymentProviderId: string;
      },
      options?: FindOptions,
    ) => Promise<PaymentProvider>;
    findProviders: (
      query: PaymentProviderQuery,
      options?: FindOptions,
    ) => Promise<Array<PaymentProvider>>;

    providerExists: (query: { paymentProviderId: string }) => Promise<boolean>;

    // Payment adapter
    findSupported: (query: { order: Order }, requestContext: Context) => Promise<Array<PaymentProvider>>;

    findInterface: (query: PaymentProvider) => PaymentInterface;
    findInterfaces: (query: { type: PaymentProviderType }) => Array<PaymentInterface>;

    configurationError: (
      paymentProvider: PaymentProvider,
      requestContext: Context,
    ) => Promise<PaymentError>;

    isActive: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context,
    ) => Promise<boolean>;

    isPayLaterAllowed: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context,
    ) => Promise<boolean>;

    calculate: (
      pricingContext: PaymentPricingContext,
      requestContext: Context,
    ) => Promise<Array<PaymentPricingCalculation>>;

    charge: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context,
    ) => Promise<any>;
    register: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context,
    ) => Promise<any>;
    sign: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context,
    ) => Promise<string>;
    validate: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context,
    ) => Promise<boolean>;
    cancel: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context,
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

    findPaymentCredentials: (query: Query, options?: FindOptions) => Promise<Array<PaymentCredentials>>;

    // Mutations

    markPreferred: (query: { userId: string; paymentCredentialsId: string }) => Promise<void>;

    upsertCredentials: (doc: PaymentCredentials & { [x: string]: any }) => Promise<string | null>;

    removeCredentials: (paymentCredentialsId: string) => Promise<PaymentCredentials>;
  };
};

/*
 * Services
 */

export type ChargeService = (
  params: {
    paymentContext: PaymentContext;
    paymentProviderId: string;
  },
  context: Context,
) => Promise<any>;

export type RegisterPaymentCredentialsService = (
  paymentProviderId: string,
  paymentContext: PaymentContext,
  context: Context,
) => Promise<PaymentCredentials | null>;

export interface PaymentServices {
  charge: ChargeService;
  registerPaymentCredentials: RegisterPaymentCredentialsService;
}

/*
 * Settings
 */

export interface PaymentProvidersSettingsOptions {
  sortProviders: any;
  filterSupportedProviders: (params: { providers: Array<PaymentProvider> }) => Array<PaymentProvider>;
}

/*
 * API Types
 */

export interface PaymentProviderHelperTypes {
  interface: (
    provider: PaymentProvider,
    _: never,
    context: Context,
  ) => {
    _id: string;
    label: string;
    version: string;
  };
  configurationError: (provider: PaymentProvider, _: never, context: Context) => Promise<PaymentError>;
}

export interface PaymentCredentialsHelperTypes {
  user(credentials: PaymentCredentials, _: never, context: Context): Promise<User>;
  paymentProvider(credentials: PaymentCredentials, _: never, context: Context): Promise<PaymentProvider>;
  isValid(credentials: PaymentCredentials, _: never, context: Context): Promise<boolean>;
}
