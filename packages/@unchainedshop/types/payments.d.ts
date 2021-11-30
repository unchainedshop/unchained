import { FindOptions } from 'mongodb';
import { Context } from './api';
import { ModuleMutations, Query, TimestampFields, _ID } from './common';
import { User } from './user';

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

export type PaymentContext =
  | {
      order: any; // TODO: Replace with order type
      orderPayment: any; // TODO: Replace with orderPayment type
      userId: string;
      paymentProviderId: string;
      transactionContext?: any;
      token?: string;
    }
  | {
      transactionContext?: never;
      token?: never;
    };

export class PaymentAdapter {
  static key: string;
  static label: string;
  static version: string;
  static typeSupported: (type: PaymentProviderType) => boolean;

  constructor(config: PaymentConfiguration, context: PaymentContext);

  charge: (context: any) => Promise<any>;
  configurationError: (context: any) => PaymentError | string; // OPEN QUESTION: Should it be fixed to the PaymentError const
  isActive: (context: any) => boolean;
  isPayLaterAllowed: (context: any) => boolean;
  register: (context: any) => Promise<any>;
  sign: (context: any) => Promise<any>;
  validate: (token: string) => Promise<boolean>;
}

export interface PaymentInterface {
  _id: string;
  label: string;
  version: string;
}

export type PaymentModule = {
  paymentProviders: ModuleMutations<PaymentProvider> & {
    // Queries
    count: (query: PaymentProviderQuery) => Promise<number>;
    findProvider: (
      query: Query & {
        paymentProviderId: string;
      },
      options: FindOptions
    ) => Promise<PaymentProvider>;
    findProviders: (
      query: PaymentProviderQuery,
      options: FindOptions
    ) => Promise<Array<PaymentProvider>>;
    providerExists: (query: { paymentProviderId: string }) => Promise<boolean>;

    findInterfaces: (query: {
      type: PaymentProviderType;
    }) => Array<PaymentInterface>;

    // Payment adapter

    configurationError: (
      paymentProviderId: string,
      context: PaymentContext
    ) => Promise<PaymentError>;
    isActive: (
      paymentProviderId: string,
      context: PaymentContext
    ) => Promise<boolean>;
    isPayLaterAllowed: (
      paymentProviderId: string,
      context: PaymentContext
    ) => Promise<boolean>;
    charge: (
      paymentProviderId: string,
      context: PaymentContext
    ) => Promise<any>;
    register: (
      paymentProviderId: string,
      context: PaymentContext
    ) => Promise<any>;
    sign: (paymentProviderId: string, context: PaymentContext) => Promise<any>;
    validate: (
      paymentProviderId: string,
      context: PaymentContext
    ) => Promise<any>;
  };
  paymentCredentials: {
    markPreferred: (query: {
      userId: string;
      paymentCredentialsId: string;
    }) => Promise<void>;
    credentialsExists: (query: {
      paymentCredentialsId: string;
    }) => Promise<boolean>;
    findCredentials: (
      query: {
        paymentCredentialsId?: string;
        userId?: string;
        paymentProviderId?: string;
      },
      options: FindOptions
    ) => Promise<PaymentCredentials>;
    upsertCredentials: (
      doc: PaymentCredentials & { [x: string]: any }
    ) => Promise<string | null>;
    removeCredentials: (
      paymentCredentialsId: string
    ) => Promise<PaymentCredentials>;
  };
};

export interface PaymentProviderHelperTypes {
  interface: (provider: PaymentProvider) => {
    _id: string;
    label: string;
    version: string;
  };
  defaultContext: (
    provider: PaymentProvider,
    paymentContext: PaymentContext,
    context: Context
  ) => PaymentContext;
  configurationError: (
    provider: PaymentProvider,
    paymentContext: PaymentContext,
    context: Context
  ) => PaymentError;
  isActive: (
    provider: PaymentProvider,
    paymentContext: PaymentContext,
    context: Context
  ) => boolean;
  isPayLaterAllowed: (
    provider: PaymentProvider,
    paymentContext: PaymentContext,
    context: Context
  ) => boolean;
  register: (
    provider: PaymentProvider,
    paymentContext: PaymentContext,
    context: Context
  ) => Promise<any>;
  sign: (
    provider: PaymentProvider,
    paymentContext: PaymentContext,
    context: Context
  ) => Promise<any>;
  charge: (
    provider: PaymentProvider,
    paymentContext: PaymentContext,
    context: Context
  ) => Promise<any>;
  validate: (
    provider: PaymentProvider,
    paymentContext: PaymentContext,
    context: Context
  ) => Promise<any>;
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
