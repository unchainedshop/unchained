import { IQuotationAdapter } from '@unchainedshop/types/quotations';
import { QuotationDirector, QuotationAdapter } from 'meteor/unchained:core-quotations';

const ManualOffering: IQuotationAdapter = {
  ...QuotationAdapter,

  key: 'shop.unchained.quotations.manual',
  version: '1.0',
  label: 'Manual Offerings',
  orderIndex: 0,

  isActivatedFor: () => true,

  actions: (params) => {
    return {
      ...QuotationAdapter.actions(params),

      quote: async () => {
        const expires = new Date();
        expires.setHours(expires.getHours() + 1000); // Expires after 1000h
        // const expires = new Date() + 1000 * 3600 * 1000, // Before refactoring
        return {
          expires,
        };
      },
    };
  },
};

QuotationDirector.registerAdapter(ManualOffering);
