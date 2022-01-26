import { Context } from './api';
import {
  Configuration,
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  LogFields,
  TimestampFields,
  _ID,
} from './common';

export enum QuotationStatus {
  REQUESTED = 'REQUESTED',
  PROCESSING = 'PROCESSING',
  PROPOSED = 'PROPOSED',
  FULLFILLED = 'FULLFILLED',
  REJECTED = 'REJECTED',
}

export enum QuotationError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export type Quotation = {
  _id?: _ID;
  configuration?: Configuration;
  context?: any;
  countryCode?: string;
  currency?: string;
  expires?: Date;
  fullfilled?: Date;
  meta?: any;
  price?: number;
  productId: string;
  quotationNumber?: string;
  rejected?: Date;
  status: string;
  userId: string;
} & LogFields &
  TimestampFields;

export type QuotationProposal = { price?: number; expires?: Date; meta?: any };

export type QuotationQuery = {
  userId?: string;
};

export interface QuotationItemConfiguration {
  quantity?: number;
  configuration: Configuration;
}

// Queries

export interface QuotationQueries {
  findQuotation: (query: { quotationId: string }, options?: FindOptions) => Promise<Quotation>;
  findQuotations: (
    query: QuotationQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions,
  ) => Promise<Array<Quotation>>;
  count: (query: QuotationQuery) => Promise<number>;
}

// Transformations

export interface QuotationTransformations {
  isExpired: (quotation: Quotation, params?: { referenceDate: Date }) => boolean;
  isProposalValid: (quotation: Quotation) => boolean;
  normalizedStatus: (quotation: Quotation) => string;
}

// Processing

type QuotationContextParams = (
  quotation: Quotation,
  params: { quotationContext?: any },
  requestContext: Context,
) => Promise<Quotation>;

export interface QuotationProcessing {
  fullfillQuotation: (quotationId: string, info: any, requestContext: Context) => Promise<Quotation>;
  proposeQuotation: QuotationContextParams;
  rejectQuotation: QuotationContextParams;
  verifyQuotation: QuotationContextParams;
  transformItemConfiguration: (
    quotation: Quotation,
    configuration: QuotationItemConfiguration,
    requestContext: Context,
  ) => Promise<QuotationItemConfiguration>;
}

// Mutations
export interface QuotationData {
  configuration?: Configuration;
  countryCode?: string;
  productId: string;
  userId: string;
}

export interface QuotationMutations {
  create: (doc: QuotationData, requestContext: Context) => Promise<Quotation>;

  updateContext: (quotationId: string, context: any, userId?: string) => Promise<Quotation>;

  updateProposal: (
    quotationId: string,
    proposal: QuotationProposal,
    userId?: string,
  ) => Promise<Quotation>;

  updateStatus: (
    quotationId: string,
    params: { status: QuotationStatus; info?: string },
    userId?: string,
  ) => Promise<Quotation>;
}

export type QuotationsModule = QuotationQueries &
  QuotationTransformations &
  QuotationProcessing &
  QuotationMutations;

// Director

export type QuotationContext = {
  quotation?: Quotation;
};

export interface QuotationAdapterActions {
  configurationError: () => QuotationError;
  isManualProposalRequired: () => Promise<boolean>;
  isManualRequestVerificationRequired: () => Promise<boolean>;
  quote: () => Promise<QuotationProposal>;
  rejectRequest: (requestContext?: any) => Promise<boolean>;
  submitRequest: (requestContext?: any) => Promise<boolean>;
  verifyRequest: (requestContext?: any) => Promise<boolean>;

  transformItemConfiguration: (
    params: QuotationItemConfiguration,
  ) => Promise<QuotationItemConfiguration>;
}

export type IQuotationAdapter = IBaseAdapter & {
  orderIndex: number;
  isActivatedFor: (quotationContext: QuotationContext, requestContext: Context) => boolean;
  actions: (params: QuotationContext & Context) => QuotationAdapterActions;
};

export type IQuotationDirector = IBaseDirector<IQuotationAdapter> & {
  actions: (quotationContext: QuotationContext, requestContext: Context) => QuotationAdapterActions;
};

/*
 * Settings
 */

export interface QuotationsSettingsOptions {
  quotationNumberHashFn?: (quotation: Quotation, index: number) => string;
}
