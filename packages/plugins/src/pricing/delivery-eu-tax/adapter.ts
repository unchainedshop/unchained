import { type IDeliveryPricingAdapter, DeliveryPricingAdapter } from '@unchainedshop/core';

import {
  isEuMemberCountry,
  resolveEuTaxCategoryFromDeliveryProvider,
  resolveEuTaxRate,
} from '../tax/eu.ts';
import resolveDeliveryLocation from '../utils/resolveDeliveryLocation.ts';
import resolveOrderDelivery from '../utils/resolveOrderDelivery.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const DeliveryEuTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-eu-tax',
  version: '1.0.0',
  label: 'Apply EU VAT on Delivery Fees',
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
        const { countryCode } = resolveDeliveryLocation({
          order: context.order,
          orderDelivery: await resolveOrderDelivery(context),
          countryCode: context.countryCode,
        });
        if (!isEuMemberCountry(countryCode)) return pricingAdapter.calculate();

        const category = resolveEuTaxCategoryFromDeliveryProvider(context.provider);
        const taxRate = resolveEuTaxRate({
          countryCode,
          category,
          referenceDate: context.order?.ordered,
        });
        if (taxRate === null) return pricingAdapter.calculate();

        DeliveryPricingAdapter.log(`DeliveryEuTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          adapterKey: DeliveryEuTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

export default DeliveryEuTax;
