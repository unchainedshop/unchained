import { type IDeliveryPricingAdapter, DeliveryPricingAdapter } from '@unchainedshop/core';

import { US_COUNTRY_CODE, isDeliveryExemptFromUsSalesTax, resolveUsSalesTaxRate } from '../tax/us.ts';
import resolveDeliveryLocation from '../utils/resolveDeliveryLocation.ts';
import resolveOrderDelivery from '../utils/resolveOrderDelivery.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const DeliveryUsSalesTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-us-sales-tax',
  version: '1.0.0',
  label: 'Apply US State Sales Tax on Delivery Fees',
  orderIndex: 80,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // A simulated delivery price has no order delivery: the location is the delivery
        // address of the order, else the billing address or the country of the order or request
        const { countryCode, regionCode } = resolveDeliveryLocation({
          order: context.order,
          orderDelivery: await resolveOrderDelivery(context),
          countryCode: context.countryCode,
        });
        if (countryCode !== US_COUNTRY_CODE) return pricingAdapter.calculate();

        // shipping taxability varies by state; providers opt out explicitly
        if (isDeliveryExemptFromUsSalesTax(context.provider)) {
          return pricingAdapter.calculate();
        }

        const taxRate = resolveUsSalesTaxRate({
          regionCode,
          referenceDate: context.order?.ordered,
        });
        if (taxRate === null) {
          DeliveryPricingAdapter.log(
            `DeliveryUsSalesTax -> unknown state '${regionCode}', no sales tax applied`,
          );
          return pricingAdapter.calculate();
        }

        DeliveryPricingAdapter.log(`DeliveryUsSalesTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          adapterKey: DeliveryUsSalesTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default DeliveryUsSalesTax;
