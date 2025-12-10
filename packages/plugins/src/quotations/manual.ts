import { type IQuotationAdapter, QuotationDirector, QuotationAdapter } from '@unchainedshop/core';

const ManualOffering: IQuotationAdapter = {
  ...QuotationAdapter,

  key: 'shop.unchained.quotations.manual',
  version: '1.0.0',
  label: 'Manual Offerings',
  orderIndex: 0,

  isActivatedFor: () => true,

  actions: (params) => {
    return {
      ...QuotationAdapter.actions(params),

      quote: async () => {
        return {
          expires: new Date(new Date().getTime() + 3600 * 1000),
        };
      },
    };
  },
};

QuotationDirector.registerAdapter(ManualOffering);
