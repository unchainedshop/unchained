import { DeliveryPricingAdapter, DeliveryPricingDirector } from '@unchainedshop/core-delivery';
import { IDeliveryPricingAdapter } from '@unchainedshop/types/delivery.pricing.js';

import { Order } from '@unchainedshop/types/orders.js';
import { DeliveryProvider } from '@unchainedshop/types/delivery.js';
import { SwissTaxCategories } from './tax/ch.js';

const getTaxRate = ({ order, provider }: { order?: Order; provider?: DeliveryProvider }) => {
  const taxCategoryFromProvider = provider?.configuration?.find(({ key }) => {
    if (key === 'swiss-tax-category') return true;
    return null;
  })?.value;

  const taxCategory = SwissTaxCategories[taxCategoryFromProvider] || SwissTaxCategories.DEFAULT;
  return taxCategory.rate(order?.ordered);
};

const isDeliveryAddressInSwitzerland = ({ orderDelivery, order, country = null }) => {
  let countryCode = country?.toUpperCase().trim() || order.countryCode;

  const address = orderDelivery?.context?.address || order?.billingAddress;

  if (address?.countryCode > '') {
    countryCode = address.countryCode?.toUpperCase().trim();
  }

  return countryCode === 'CH' || countryCode === 'LI';
};

export const DeliverySwissTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-swiss-tax',
  version: '1.0.0',
  label: 'Apply Swiss Tax on Delivery Fees',
  orderIndex: 20,

  isActivatedFor: (context) => {
    return isDeliveryAddressInSwitzerland(context);
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
              meta: { adapter: DeliverySwissTax.key },
            });
          } else {
            const taxAmount = row.amount * taxRate;
            pricingAdapter.resultSheet().addTax({
              amount: taxAmount,
              rate: taxRate,
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
