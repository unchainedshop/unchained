import {
  DeliveryPricingRowCategory,
  type IDeliveryPricingAdapter,
  DeliveryPricingAdapter,
} from '@unchainedshop/core';

import {
  resolveUkTaxCategoryFromDeliveryProvider,
  UkTaxCategories,
  UK_VAT_COUNTRY_CODES,
} from '../tax/uk.ts';
import isDeliveryAddressInCountry from '../utils/isDeliveryAddressInCountry.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const DeliveryUkTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-uk-tax',
  version: '1.0.0',
  label: 'Apply UK VAT on Delivery Fees',
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
      UK_VAT_COUNTRY_CODES,
    );
  },

  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        const taxCategory =
          resolveUkTaxCategoryFromDeliveryProvider(context.provider) || UkTaxCategories.STANDARD;
        const taxRate = taxCategory.rate(context.order?.ordered);

        DeliveryPricingAdapter.log(`DeliveryUkTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          baseCategory: DeliveryPricingRowCategory.Delivery,
          adapterKey: DeliveryUkTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default DeliveryUkTax;
