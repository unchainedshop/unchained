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
        // The proposal derives from persisted quotation state: the context
        // passed to makeQuotationProposal is stored on quotation.context, so
        // e.g. makeQuotationProposal(quotationId, { price: 1584 }) proposes a
        // unit price of 1584 (minor units of the quotation's currency).
        const { quotation } = params;
        const price = Number(quotation?.context?.price);
        return {
          expires: quotation?.context?.expires
            ? new Date(quotation.context.expires)
            : new Date(new Date().getTime() + 3600 * 1000),
          price: Number.isFinite(price) && price > 0 ? Math.round(price) : undefined,
        };
      },
    };
  },
};

QuotationDirector.registerAdapter(ManualOffering);
