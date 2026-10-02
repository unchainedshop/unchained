import { type IPaymentPricingAdapter, PaymentPricingAdapter } from '@unchainedshop/core';

import { resolveTaxCategoryFromPaymentProvider, SwissTaxCategories } from '../tax/ch.ts';
import isDeliveryAddressInCountry from '../utils/isDeliveryAddressInCountry.ts';
import resolveOrderDelivery from '../utils/resolveOrderDelivery.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

// A payment fee charged to the buyer is part of the consideration for the supply
// (Art. 24 para. 1 MWSTG) and, as an ancillary supply, shares the tax treatment of the
// goods (Art. 19 para. 4 MWSTG): it is taxed where the goods are, at the rate of the
// main supply (the provider's `swiss-tax-category`, DEFAULT if not set).
export const PaymentSwissTax: IPaymentPricingAdapter = {
  ...PaymentPricingAdapter,

  key: 'shop.unchained.pricing.payment-swiss-tax',
  version: '1.0.0',
  label: 'Apply Swiss Tax on Payment Fees',
  orderIndex: 80,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = PaymentPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // Same location as the goods: the delivery address, else the billing address,
        // else the country of the order or request (simulated payment prices)
        const orderDelivery = await resolveOrderDelivery(context);
        if (
          !isDeliveryAddressInCountry(
            {
              order: context.order,
              orderDelivery,
              countryCode: context.countryCode,
            },
            ['CH', 'LI'],
          )
        ) {
          return pricingAdapter.calculate();
        }

        const taxCategory =
          resolveTaxCategoryFromPaymentProvider(context.provider) || SwissTaxCategories.DEFAULT;
        const taxRate = taxCategory.rate(context.order?.ordered);

        PaymentPricingAdapter.log(`PaymentSwissTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          adapterKey: PaymentSwissTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default PaymentSwissTax;
