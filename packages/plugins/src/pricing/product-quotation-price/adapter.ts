import { ProductPricingAdapter, type IProductPricingAdapter } from '@unchainedshop/core';

// Replaces the catalog price of a cart position that was added via addCartQuotation with
// the proposed unit price of its quotation. Runs right after the catalog price so that
// discounts and taxes apply on top of the quoted price. The proposal states whether the
// quoted price is taxable and net (quotation.isTaxable / isNetPrice); a quotation proposed
// without these flags counts as a taxable gross price, independent of the catalog price.
export const ProductQuotationPrice: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-quotation-price',
  version: '1.0.0',
  label: 'Apply the proposed price of a quotation',
  orderIndex: 1,

  isActivatedFor: (context) => {
    return Boolean(context.quotationId);
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { quotationId, product, order, currencyCode, quantity, modules } = params.context;

        const quotation = await modules.quotations.findQuotation({ quotationId: quotationId! });
        if (
          !quotation ||
          quotation.price == null ||
          !order ||
          !modules.quotations.isProposalValidFor(quotation, {
            userId: order.userId,
            productId: product._id,
            currencyCode,
          })
        ) {
          return pricingAdapter.calculate();
        }

        pricingAdapter.resultSheet().resetCalculation(params.calculationSheet);
        pricingAdapter.resultSheet().addItem({
          amount: quotation.price * quantity,
          isTaxable: quotation.isTaxable ?? true,
          isNetPrice: quotation.isNetPrice ?? false,
          meta: { adapter: ProductQuotationPrice.key, quotationId },
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default ProductQuotationPrice;
