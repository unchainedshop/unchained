import { type IPaymentPricingAdapter, PaymentPricingAdapter } from '@unchainedshop/core';

import {
  resolveUkTaxCategoryFromPaymentProvider,
  UkTaxCategories,
  UK_VAT_COUNTRY_CODES,
} from '../tax/uk.ts';
import isDeliveryAddressInCountry from '../utils/isDeliveryAddressInCountry.ts';
import resolveOrderDelivery from '../utils/resolveOrderDelivery.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

// A payment fee charged to the buyer is further consideration for the goods, not a
// separate exempt payment service (SilverDoor v HMRC [2024] UKUT 147, following CJEU
// C-276/09): it is taxed where the goods are, at the rate of the main supply (the
// provider's `uk-tax-category`, STANDARD if not set).
export const PaymentUkTax: IPaymentPricingAdapter = {
  ...PaymentPricingAdapter,

  key: 'shop.unchained.pricing.payment-uk-tax',
  version: '1.0.0',
  label: 'Apply UK VAT on Payment Fees',
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
            UK_VAT_COUNTRY_CODES,
          )
        ) {
          return pricingAdapter.calculate();
        }

        const taxCategory =
          resolveUkTaxCategoryFromPaymentProvider(context.provider) || UkTaxCategories.STANDARD;
        const taxRate = taxCategory.rate(context.order?.ordered);

        PaymentPricingAdapter.log(`PaymentUkTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          adapterKey: PaymentUkTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default PaymentUkTax;
