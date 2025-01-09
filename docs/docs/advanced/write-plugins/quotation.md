---
sidebar_position: 9
sidebar_label: Quotations
title: Quotations
---
:::info
Customizing quotation
:::


## QuotationAdapter

You can accept quotation requests for a shop items. For every quotation received you can setup a quotation adapter to process this request manually or automatically. In order to process quotation request you need to create a quotation adapter that implements the [IQuotationAdapter](https://docs.unchained.shop/types/types/quotations.IQuotationAdapter.html) and register the adapter on the global quotation director that implements the [IQuotationDirector](https://docs.unchained.shop/types/types/quotations.IQuotationDirector.html).

There can be multiple quotation adapters configured and active for a store and all of them will be executed for every quotation requests based on there `orderIndex` value. Quotation adapters that have smaller `orderIndex` value will be executed first.

Below is a sample manual quotation adapter implementation that will mark every quotation request as expired after an hour of request if no quote is given in between by a user that is managing quotation requests. 

```typescript
import { log, LogLevel } from '@unchainedshop/logger';

import { IQuotationAdapter } from '@unchainedshop/core-quotations';
import { QuotationError } from '@unchainedshop/core-quotations';

export const ManualOffering: IQuotationAdapter = {
  key: 'shop.unchained.quotations.manual',
  label: 'Manual quotation'
  version: '1.0.0',
  orderIndex: 1,

  isActivatedFor: (quotationContext: QuotationContext, unchainedAPI: UnchainedCore): boolean => {
    return false;
  },

  actions: (params: QuotationContext & Context): QuotationAdapterActions => {
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
      return {
          expires: new Date(new Date().getTime() + 3600 * 1000),
        };
      },

      rejectRequest: async (unchainedAPI?: any): Promise<boolean> => {
        return true;
      },

      submitRequest: async (unchainedAPI?: any): Promise<boolean> => {
        return true;
      },

      verifyRequest: async (unchainedAPI?: any): Promise<boolean> => {
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


- **isActivatedFor: (quotationContext: [QuotationContext](https://docs.unchained.shop/types/types/quotations.QuotationContext.html), unchainedAPI: [UnchainedCore](https://docs.unchained.shop/types/interfaces/core.UnchainedCore.html))**: Determines for which type of quotation request an adapter is active for. it can be based on the actual quotation in question or any condition you can think of.
- **configurationError: [QuotationError](https://docs.unchained.shop/types/enums/quotations.QuotationError.html)**: Returns any error that occurred while initializing the adapter. it can be missing environment variable or and other missing required values.
- **isManualRequestVerificationRequired**: defines if a quotation should be considered valid and ready for quote automatically or should be verified by someone manually.
- **isManualProposalRequired** Define if a user can respond to quotation request manually or not.
- **quote**: Responds with the actual quotation request.
- **rejectRequest** Will mark a quotation as rejected if returned to based on any condition check performed.
- **submitRequest**: Will approve a quotation request for processing if you return true from this function.
- **verifyRequest** It will mark the quotation as verified for a certain quotation if this function returns true.
- **transformItemConfiguration(params: [QuotationItemConfiguration](https://docs.unchained.shop//types/interfaces/quotations.QuotationItemConfiguration.html))**: A quotation request is submitted as a `JSON` value and there is no predefined format of quotation request. use this function to transform the submitted `JSON` from the front end into a structure that will be best to work with in an adapter.



## Registering Quotation Adapter

```typescript
import { QuotationDirector } from '@unchainedshop/core-quotations';

QuotationDirector.registerAdapter(ManualOffering);
```