---
title: 'Quotation plugins'
description: 'Customizing quotation'
---


```typescript
import { log, LogLevel } from '@unchainedshop/logger';

import { IQuotationAdapter } from '@unchainedshop/types/quotations';
import { QuotationError } from '@unchainedshop/core-quotations';

export const QuotationAdapter: Omit<IQuotationAdapter, 'key' | 'label' | 'version'> = {
  orderIndex: 0,

  isActivatedFor: (quotationContext: QuotationContext, requestContext: Context): boolean => {
    return false;
  },

  actions: (params: QuotationContext & Context) => {
    return {
      configurationError: (): QuotationError => {
        return QuotationError.NOT_IMPLEMENTED;
      },

      isManualRequestVerificationRequired: async (): Promise<boolean> => {
        return true;
      },

      isManualProposalRequired: async (): Promise<boolean> => {
        return true;
      },

      quote: async (): Promise<QuotationProposal> => {
        return {};
      },

      rejectRequest: async (requestContext?: any): Promise<boolean> => {
        return true;
      },

      submitRequest: async (requestContext?: any): Promise<boolean> => {
        return true;
      },

      verifyRequest: async (requestContext?: any): Promise<boolean> => {
        return true;
      },

      transformItemConfiguration: async (params: QuotationItemConfiguration) => {
        return { quantity: params.quantity, configuration: params.configuration };
      },
    };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};

```