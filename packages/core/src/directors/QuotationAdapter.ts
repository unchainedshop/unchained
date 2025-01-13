import {
  Quotation,
  QuotationItemConfiguration,
  QuotationProposal,
} from '@unchainedshop/core-quotations';
import { BaseAdapter, IBaseAdapter } from '@unchainedshop/utils';

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
  isActivatedFor: (quotationContext: QuotationContext, unchainedAPI) => boolean;
  actions: (params: QuotationContext) => QuotationAdapterActions;
};

export enum QuotationError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export const QuotationAdapter: Omit<IQuotationAdapter, 'key' | 'label' | 'version'> = {
  ...BaseAdapter,
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
