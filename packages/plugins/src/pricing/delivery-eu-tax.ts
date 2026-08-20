import {
  DeliveryPricingRowCategory,
  type IDeliveryPricingAdapter,
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
} from '@unchainedshop/core';

import {
  isEuMemberCountry,
  resolveEuTaxCategoryFromDeliveryProvider,
  resolveEuTaxRate,
} from './tax/eu.ts';
import resolveDeliveryLocation from './utils/resolveDeliveryLocation.ts';
import { applyTaxRateToTaxableRows } from './tax/applyTaxRateToTaxableRows.ts';

export const DeliveryEuTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-eu-tax',
  version: '1.0.0',
  label: 'Apply EU VAT on Delivery Fees',
  orderIndex: 80,

  isActivatedFor: (context) => {
    if (!context.order) return false;
    if (!context.orderDelivery) return false;
    const { countryCode } = resolveDeliveryLocation({
      order: context.order,
      orderDelivery: context.orderDelivery,
      countryCode: context.countryCode,
    });
    return isEuMemberCountry(countryCode);
  },

  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { countryCode } = resolveDeliveryLocation({
          order: context.order,
          orderDelivery: context.orderDelivery,
          countryCode: context.countryCode,
        });
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
          baseCategory: DeliveryPricingRowCategory.Delivery,
          adapterKey: DeliveryEuTax.key,
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

DeliveryPricingDirector.registerAdapter(DeliveryEuTax);
