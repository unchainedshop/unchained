import { Context } from './api';
import {
  FindOptions,
  ModuleMutations,
  Query,
  TimestampFields,
  _ID,
} from './common';
import { User } from '@unchainedshop/types/user';
import { Order, OrderPayment } from './orders';

export enum PaymentProviderType {
  CARD = 'CARD',
  INVOICE = 'INVOICE',
  GENERIC = 'GENERIC',
}

export type PaymentConfiguration = Array<{
  key: string;
  value: string;
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
  meta: unknown;
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
  meta?: any
}

export interface PaymentAdapter {
  charge: (context: any) => Promise<any>;
  configurationError: (context: any) => PaymentError | string; // OPEN QUESTION: Should it be fixed to the PaymentError const
  isActive: (context: any) => boolean;
  isPayLaterAllowed: (context: any) => boolean;
  register: (context: any) => Promise<any>;
  sign: (context: any) => Promise<any>;
  validate: (token: any) => Promise<any>;
}

export interface PaymentDirector {
  configurationError: () => PaymentError; // OPEN QUESTION: Should it be fixed to the PaymentError const
  isActive: () => boolean;
  isPayLaterAllowed: () => boolean;
  charge: (context?: any, userId?: string) => Promise<any>;
  register: () => Promise<any>;
  sign: () => Promise<any>;
  validate: () => Promise<any>;
  run: (command: string, args: any) => Promise<boolean>;
}

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

    findSupported: (
      query: { order: Order }
    ) => Array<string>;

    findInterface: (query: PaymentProvider) => PaymentInterface;
    findInterfaces: (query: {
      type: PaymentProviderType;
    }) => Array<PaymentInterface>;

    providerExists: (query: { paymentProviderId: string }) => Promise<boolean>;

    // Payment adapter

    configurationError: (paymentProvider: PaymentProvider) => PaymentError;

    isActive: (
      paymentProviderId: string,
      context?: PaymentContext
    ) => Promise<boolean>;
    isPayLaterAllowed: (
      paymentProviderId: string,
      context?: PaymentContext
    ) => Promise<boolean>;
    charge: (
      paymentProviderId: string,
      context?: PaymentContext
    ) => Promise<any>;
    register: (
      paymentProviderId: string,
      context?: PaymentContext
    ) => Promise<any>;
    sign: (paymentProviderId: string, context?: PaymentContext) => Promise<any>;
    validate: (
      paymentProviderId: string,
      context?: PaymentContext
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
