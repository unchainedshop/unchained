import { type IDeliveryPricingAdapter, DeliveryPricingAdapter } from '@unchainedshop/core';

import { resolveTaxCategoryFromDeliveryProvider, SwissTaxCategories } from '../tax/ch.ts';
import isDeliveryAddressInCountry from '../utils/isDeliveryAddressInCountry.ts';
import resolveOrderDelivery from '../utils/resolveOrderDelivery.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const DeliverySwissTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-swiss-tax',
  version: '1.0.0',
  label: 'Apply Swiss Tax on Delivery Fees',
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
        if (
          !isDeliveryAddressInCountry(
            {
              order: context.order,
              orderDelivery: await resolveOrderDelivery(context),
              countryCode: context.countryCode,
            },
            ['CH', 'LI'],
          )
        ) {
          return pricingAdapter.calculate();
        }

        const taxCategory =
          resolveTaxCategoryFromDeliveryProvider(context.provider) || SwissTaxCategories.DEFAULT;
        const taxRate = taxCategory.rate(context.order?.ordered);

        DeliveryPricingAdapter.log(`DeliverySwissTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          adapterKey: DeliverySwissTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default DeliverySwissTax;
