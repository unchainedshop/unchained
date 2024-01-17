import type { FindOptions } from 'mongodb';
import { SortOption } from './api.js';
import { Configuration, IBaseAdapter, IBaseDirector, LogFields, TimestampFields } from './common.js';
import { UnchainedCore } from './core.js';

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
  _id?: string;
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
  queryString?: string;
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
      sort?: Array<SortOption>;
    },
    options?: FindOptions,
  ) => Promise<Array<Quotation>>;
  count: (query: QuotationQuery) => Promise<number>;
  openQuotationWithProduct: (param: { productId: string }) => Promise<Quotation | null>;
}

// Transformations

export interface QuotationTransformations {
  isExpired: (quotation: Quotation, params?: { referenceDate: Date }) => boolean;
  isProposalValid: (quotation: Quotation) => boolean;
  normalizedStatus: (quotation: Quotation) => string;
}

// Processing

export type QuotationContextParams = (
  quotation: Quotation,
  params: { quotationContext?: any },
  unchainedAPI: UnchainedCore,
) => Promise<Quotation>;

export interface QuotationProcessing {
  fullfillQuotation: (quotationId: string, info: any, unchainedAPI: UnchainedCore) => Promise<Quotation>;
  proposeQuotation: QuotationContextParams;
  rejectQuotation: QuotationContextParams;
  verifyQuotation: QuotationContextParams;
  transformItemConfiguration: (
    quotation: Quotation,
    configuration: QuotationItemConfiguration,
    unchainedAPI: UnchainedCore,
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
  create: (doc: QuotationData, unchainedAPI: UnchainedCore) => Promise<Quotation>;

  updateContext: (quotationId: string, context: any) => Promise<Quotation>;

  updateProposal: (quotationId: string, proposal: QuotationProposal) => Promise<Quotation>;

  updateStatus: (
    quotationId: string,
    params: { status: QuotationStatus; info?: string },
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
  rejectRequest: (unchainedAPI?: any) => Promise<boolean>;
  submitRequest: (unchainedAPI?: any) => Promise<boolean>;
  verifyRequest: (unchainedAPI?: any) => Promise<boolean>;

  transformItemConfiguration: (
    params: QuotationItemConfiguration,
  ) => Promise<QuotationItemConfiguration>;
}

export type IQuotationAdapter = IBaseAdapter & {
  orderIndex: number;
  isActivatedFor: (quotationContext: QuotationContext, unchainedAPI: UnchainedCore) => boolean;
  actions: (params: QuotationContext & UnchainedCore) => QuotationAdapterActions;
};

export type IQuotationDirector = IBaseDirector<IQuotationAdapter> & {
  actions: (
    quotationContext: QuotationContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<QuotationAdapterActions>;
};

/*
 * Settings
 */

export interface QuotationsSettingsOptions {
  quotationNumberHashFn?: (quotation: Quotation, index: number) => string;
}
