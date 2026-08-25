import {
  DeliveryPricingRowCategory,
  type IDeliveryPricingAdapter,
  DeliveryPricingAdapter,
} from '@unchainedshop/core';

import { resolveTaxCategoryFromDeliveryProvider, SwissTaxCategories } from '../tax/ch.ts';
import isDeliveryAddressInCountry from '../utils/isDeliveryAddressInCountry.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const DeliverySwissTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-swiss-tax',
  version: '1.0.0',
  label: 'Apply Swiss Tax on Delivery Fees',
  orderIndex: 80,

  isActivatedFor: (context) => {
    if (!context.order) return false;
    if (!context.orderDelivery) return false;
    return isDeliveryAddressInCountry(
      {
        order: context.order,
        orderDelivery: context.orderDelivery,
        countryCode: context.countryCode,
      },
      ['CH', 'LI'],
    );
  },

  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        const taxCategory =
          resolveTaxCategoryFromDeliveryProvider(context.provider) || SwissTaxCategories.DEFAULT;
        const taxRate = taxCategory.rate(context.order?.ordered);

        DeliveryPricingAdapter.log(`DeliverySwissTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          baseCategory: DeliveryPricingRowCategory.Delivery,
          adapterKey: DeliverySwissTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default DeliverySwissTax;
