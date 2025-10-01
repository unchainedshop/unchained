import {
  DeliveryPricingRowCategory,
  IDeliveryPricingAdapter,
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
} from '@unchainedshop/core';

import { Order } from '@unchainedshop/core-orders';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { isDeliveryAddressInSwitzerland, SwissTaxCategories } from './tax/ch.js';

const getTaxRate = ({ order, provider }: { order?: Order; provider?: DeliveryProvider }) => {
  const taxCategoryFromProvider = provider?.configuration?.find(({ key }) => {
    if (key === 'swiss-tax-category') return true;
    return null;
  })?.value;

  const taxCategory = taxCategoryFromProvider
    ? SwissTaxCategories[taxCategoryFromProvider] || SwissTaxCategories.DEFAULT
    : SwissTaxCategories.DEFAULT;
  return taxCategory.rate(order?.ordered);
};

export const DeliverySwissTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-swiss-tax',
  version: '1.0.0',
  label: 'Apply Swiss Tax on Delivery Fees',
  orderIndex: 80,

  isActivatedFor: (context) => {
    if (!context.order) return false;
    if (!context.orderDelivery) return false;
    return isDeliveryAddressInSwitzerland({
      order: context.order,
      orderDelivery: context.orderDelivery,
      countryCode: context.countryCode,
    });
  },

  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        const taxRate = getTaxRate(context);
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
