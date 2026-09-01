import {
  DeliveryPricingRowCategory,
  type IDeliveryPricingAdapter,
  DeliveryPricingAdapter,
} from '@unchainedshop/core';

import { US_COUNTRY_CODE, isDeliveryExemptFromUsSalesTax, resolveUsSalesTaxRate } from '../tax/us.ts';
import resolveDeliveryLocation from '../utils/resolveDeliveryLocation.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const DeliveryUsSalesTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-us-sales-tax',
  version: '1.0.0',
  label: 'Apply US State Sales Tax on Delivery Fees',
  orderIndex: 80,

  isActivatedFor: (context) => {
    if (!context.order) return false;
    if (!context.orderDelivery) return false;
    const { countryCode } = resolveDeliveryLocation({
      order: context.order,
      orderDelivery: context.orderDelivery,
      countryCode: context.countryCode,
    });
    return countryCode === US_COUNTRY_CODE;
  },

  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // shipping taxability varies by state; providers opt out explicitly
        if (isDeliveryExemptFromUsSalesTax(context.provider)) {
          return pricingAdapter.calculate();
        }

        const { regionCode } = resolveDeliveryLocation({
          order: context.order,
          orderDelivery: context.orderDelivery,
          countryCode: context.countryCode,
        });
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
          baseCategory: DeliveryPricingRowCategory.Delivery,
          adapterKey: DeliveryUsSalesTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default DeliveryUsSalesTax;
