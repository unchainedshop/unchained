import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';
import { TimestampFields, LogFields } from '@unchainedshop/mongodb';
import { UnchainedCore } from '@unchainedshop/core';

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
  configuration?: Array<{ key: string; value: string }>;
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

export interface QuotationItemConfiguration {
  quantity?: number;
  configuration: Array<{ key: string; value: string }>;
}

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
