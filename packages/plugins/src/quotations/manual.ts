import { IQuotationAdapter } from '@unchainedshop/core-quotations';
import { QuotationDirector, QuotationAdapter } from '@unchainedshop/core-quotations';

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
