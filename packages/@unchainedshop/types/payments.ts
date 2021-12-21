import { Context } from './api';
import {
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  ModuleMutations,
  Query,
  TimestampFields,
  _ID,
} from './common';
import { User } from './user';
import { Order, OrderPayment } from './orders';

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

export type BityCredentials = {
  _id?: _ID;
  externalId: string;
  data: {
    iv: string;
    encryptedData: string;
  };
  expires: Date;
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
  sign: (transactionContext?: any) => Promise<any>;
  validate: (token?: any) => Promise<any>;
}

export type IPaymentAdapter = IBaseAdapter & {
  initialConfiguration: PaymentConfiguration;

  typeSupported: (type: PaymentProviderType) => boolean;

  actions: (params: {
    config: PaymentConfiguration;
    context: PaymentContext & Context;
  }) => IPaymentActions;
};

export type IPaymentDirector = IBaseDirector<IPaymentAdapter> & {
  actions: (
    paymentProvider: PaymentProvider,
    paymentContext: PaymentContext,
    requestContext: Context
  ) => IPaymentActions & {
    run: (command: string, args: any) => Promise<boolean>;
  };
};

export interface PaymentInterface {
  _id: string;
  label: string;
  version: string;
}

export type PaymentModule = {
  /*
   * Payment Providers Module
   */

  paymentProviders: ModuleMutations<PaymentProvider> & {
    // Queries
    count: (query: PaymentProviderQuery) => Promise<number>;
    findProvider: (
      query: Query & {
        paymentProviderId: string;
      },
      options?: FindOptions<PaymentProvider>
    ) => Promise<PaymentProvider>;
    findProviders: (
      query: PaymentProviderQuery,
      options?: FindOptions<PaymentProvider>
    ) => Promise<Array<PaymentProvider>>;

    providerExists: (query: { paymentProviderId: string }) => Promise<boolean>;

    // Payment adapter
    findSupported: (
      query: { order: Order },
      requestContext: Context
    ) => Array<string>;

    findInterface: (query: PaymentProvider) => PaymentInterface;
    findInterfaces: (query: {
      type: PaymentProviderType;
    }) => Array<PaymentInterface>;

    configurationError: (
      paymentProvider: PaymentProvider,
      requestContext: Context
    ) => Promise<PaymentError>;

    isActive: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context
    ) => Promise<boolean>;

    isPayLaterAllowed: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context
    ) => Promise<boolean>;

    charge: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context
    ) => Promise<any>;
    register: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context
    ) => Promise<any>;
    sign: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context
    ) => Promise<any>;
    validate: (
      paymentProviderId: string,
      paymentContext: PaymentContext,
      requestContext: Context
    ) => Promise<any>;
  };

  /*
   * Payment Credentials Module
   */

  paymentCredentials: {
    // Queries

    credentialsExists: (query: {
      paymentCredentialsId: string;
    }) => Promise<boolean>;

    findPaymentCredential: (
      query: {
        paymentCredentialsId?: string;
        userId?: string;
        paymentProviderId?: string;
        isPreferred?: boolean;
      },
      options?: FindOptions<PaymentCredentials>
    ) => Promise<PaymentCredentials>;

    findPaymentCredentials: (
      query: Query,
      options?: FindOptions<PaymentCredentials>
    ) => Promise<Array<PaymentCredentials>>;

    // Mutations

    markPreferred: (query: {
      userId: string;
      paymentCredentialsId: string;
    }) => Promise<void>;

    upsertCredentials: (
      doc: PaymentCredentials & { [x: string]: any }
    ) => Promise<string | null>;

    removeCredentials: (
      paymentCredentialsId: string
    ) => Promise<PaymentCredentials>;
  };

  /*
   * Bity Credentials Module
   */

  bityCredentials: {
    findBityCredentials: (query: {
      externalId: string;
    }) => Promise<BityCredentials>;

    upsertCredentials: (doc: BityCredentials, userId: string) => Promise<string | null>;
  };
};

export interface PaymentProviderHelperTypes {
  interface: (
    provider: PaymentProvider,
    _: never,
    context: Context
  ) => {
    _id: string;
    label: string;
    version: string;
  };
  configurationError: (
    provider: PaymentProvider,
    _: never,
    context: Context
  ) => PaymentError;
}

export interface PaymentCredentialsHelperTypes {
  user(
    credentials: PaymentCredentials,
    _: never,
    context: Context
  ): Promise<User>;
  paymentProvider(
    credentials: PaymentCredentials,
    _: never,
    context: Context
  ): Promise<PaymentProvider>;
  isValid(
    credentials: PaymentCredentials,
    _: never,
    context: Context
  ): Promise<boolean>;
}
