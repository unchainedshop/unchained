import type {
  Quotation,
  QuotationItemConfiguration,
  QuotationProposal,
} from '@unchainedshop/core-quotations';
import { BaseAdapter, type IBaseAdapter } from '@unchainedshop/utils';

export interface QuotationContext {
  quotation?: Quotation;
}

export interface QuotationAdapterActions {
  configurationError: () => QuotationError | null;
  isManualProposalRequired: () => Promise<boolean>;
  isManualRequestVerificationRequired: () => Promise<boolean>;
  quote: () => Promise<QuotationProposal>;
  rejectRequest: (unchainedAPI?: any) => Promise<boolean>;
  submitRequest: (unchainedAPI?: any) => Promise<boolean>;
  verifyRequest: (unchainedAPI?: any) => Promise<boolean>;

  transformItemConfiguration: (
    params: QuotationItemConfiguration,
  ) => Promise<QuotationItemConfiguration | null>;
}

export type IQuotationAdapter = IBaseAdapter & {
  orderIndex: number;
  isActivatedFor: (quotationContext: QuotationContext, unchainedAPI) => boolean;
  actions: (params: QuotationContext) => QuotationAdapterActions;
};

export const QuotationError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
} as const;

export type QuotationError = (typeof QuotationError)[keyof typeof QuotationError];

export const QuotationAdapter: Omit<IQuotationAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
  adapterType: Symbol.for('unchained:adapter:quotation'),
  orderIndex: 0,

  isActivatedFor: () => {
    return false;
  },

  actions: () => {
    return {
      configurationError: () => {
        return QuotationError.NOT_IMPLEMENTED;
      },

      isManualRequestVerificationRequired: async () => {
        return true;
      },

      isManualProposalRequired: async () => {
        return true;
      },

      quote: async () => {
        return {};
      },

      rejectRequest: async () => {
        return true;
      },

      submitRequest: async () => {
        return true;
      },

      verifyRequest: async () => {
        return true;
      },

      transformItemConfiguration: async ({ quantity, configuration }) => {
        return { quantity, configuration };
      },
    };
  },
};
