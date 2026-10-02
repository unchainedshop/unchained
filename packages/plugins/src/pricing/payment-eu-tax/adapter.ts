import { type IPaymentPricingAdapter, PaymentPricingAdapter } from '@unchainedshop/core';

import { resolveEuTaxCategoryFromPaymentProvider, resolveEuTaxRate } from '../tax/eu.ts';
import resolveDeliveryLocation from '../utils/resolveDeliveryLocation.ts';
import resolveOrderDelivery from '../utils/resolveOrderDelivery.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

// A payment fee charged to the buyer is an incidental expense of the supply (Art. 78(b)
// VAT Directive) and not a separate exempt payment service (CJEU C-276/09 Everything
// Everywhere): it is taxed where the goods are, at the rate of the main supply (the
// provider's `eu-tax-category`, the standard rate if not set).
export const PaymentEuTax: IPaymentPricingAdapter = {
  ...PaymentPricingAdapter,

  key: 'shop.unchained.pricing.payment-eu-tax',
  version: '1.0.0',
  label: 'Apply EU VAT on Payment Fees',
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
        const { countryCode } = resolveDeliveryLocation({
          order: context.order,
          orderDelivery,
          countryCode: context.countryCode,
        });
        const taxRate = resolveEuTaxRate({
          countryCode,
          category: resolveEuTaxCategoryFromPaymentProvider(context.provider),
          referenceDate: context.order?.ordered,
        });
        // not an EU destination
        if (taxRate === null) return pricingAdapter.calculate();

        PaymentPricingAdapter.log(`PaymentEuTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          adapterKey: PaymentEuTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default PaymentEuTax;
