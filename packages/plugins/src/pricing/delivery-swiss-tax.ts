import {
  DeliveryPricingRowCategory,
  IDeliveryPricingAdapter,
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
} from '@unchainedshop/core';

import { resolveTaxCategoryFromDeliveryProvider, SwissTaxCategories } from './tax/ch.js';
import isDeliveryAddressInCountry from './utils/isDeliveryAddressInCountry.js';

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
        params.calculationSheet.filterBy({ isTaxable: true }).forEach(({ isNetPrice, ...row }) => {
          if (!isNetPrice) {
            const taxAmount = row.amount - row.amount / (1 + taxRate);
            pricingAdapter.resultSheet().calculation.push({
              ...row,
              amount: -taxAmount,
              isTaxable: false,
              isNetPrice: false,
              meta: { adapter: DeliverySwissTax.key },
            });
            pricingAdapter.resultSheet().addTax({
              amount: taxAmount,
              rate: taxRate,
              baseCategory: DeliveryPricingRowCategory.Delivery,
              meta: { adapter: DeliverySwissTax.key },
            });
          } else {
            const taxAmount = row.amount * taxRate;
            pricingAdapter.resultSheet().addTax({
              amount: taxAmount,
              rate: taxRate,
              baseCategory: DeliveryPricingRowCategory.Delivery,
              meta: { adapter: DeliverySwissTax.key },
            });
          }
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

DeliveryPricingDirector.registerAdapter(DeliverySwissTax);
