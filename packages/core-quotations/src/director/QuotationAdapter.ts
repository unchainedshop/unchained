import { log, LogLevel } from '@unchainedshop/logger';
import { IQuotationAdapter } from '../types.js';
import { QuotationError } from './QuotationError.js';

export const QuotationAdapter: Omit<IQuotationAdapter, 'key' | 'label' | 'version'> = {
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

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
