import { type IDeliveryPricingAdapter, DeliveryPricingAdapter } from '@unchainedshop/core';

import {
  resolveUkTaxCategoryFromDeliveryProvider,
  UkTaxCategories,
  UK_VAT_COUNTRY_CODES,
} from '../tax/uk.ts';
import isDeliveryAddressInCountry from '../utils/isDeliveryAddressInCountry.ts';
import resolveOrderDelivery from '../utils/resolveOrderDelivery.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const DeliveryUkTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-uk-tax',
  version: '1.0.0',
  label: 'Apply UK VAT on Delivery Fees',
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
            UK_VAT_COUNTRY_CODES,
          )
        ) {
          return pricingAdapter.calculate();
        }

        const taxCategory =
          resolveUkTaxCategoryFromDeliveryProvider(context.provider) || UkTaxCategories.STANDARD;
        const taxRate = taxCategory.rate(context.order?.ordered);

        DeliveryPricingAdapter.log(`DeliveryUkTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          adapterKey: DeliveryUkTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default DeliveryUkTax;
