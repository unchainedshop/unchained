/* @ts-ignore */
import moment from 'moment';
import {
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
} from 'meteor/unchained:core-delivery';
import {
  DeliveryPricingAdapterContext,
  IDeliveryPricingAdapter,
} from '@unchainedshop/types/delivery.pricing';

// https://www.ch.ch/de/mehrwertsteuersatz-schweiz/
export const SwissTaxCategories = {
  DEFAULT: {
    rate: (date) => {
      const referenceDate = moment(date);
      if (referenceDate.isBefore('2018-01-01')) {
        return 0.08;
      }
      return 0.077;
    },
  },
  REDUCED: {
    value: 'reduced',
    rate: () => {
      return 0.025;
    },
  },
  SPECIAL: {
    value: 'special',
    rate: () => {
      return 0.037;
    },
  },
};

const getTaxRate = (context: DeliveryPricingAdapterContext) => {
  const date =
    context.order && context.order.ordered
      ? new Date(context.order.ordered)
      : new Date();

  const taxCategoryFromProvider = context.deliveryProvider?.configuration?.find(
    ({ key }) => {
      if (key === 'swiss-tax-category') return true;
      return null;
    }
  )?.value;

  if (taxCategoryFromProvider === SwissTaxCategories.REDUCED.value) {
    return SwissTaxCategories.REDUCED.rate();
  }
  if (taxCategoryFromProvider === SwissTaxCategories.SPECIAL.value) {
    return SwissTaxCategories.SPECIAL.rate();
  }
  return SwissTaxCategories.DEFAULT.rate(date);
};

export const DeliverySwissTax: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-swiss-tax',
  version: '1.0',
  label: 'Apply Swiss Tax on Delivery Fees',
  orderIndex: 20,

  isActivatedFor: async ({ order, country, modules }) => {
    let countryCode = country?.toUpperCase().trim();

    if (order) {
      const orderDelivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });
      const address = orderDelivery?.context?.address || order.billingAddress;

      if (address?.countryCode > '') {
        countryCode = address.countryCode?.toUpperCase().trim();
      }
    }

    return countryCode === 'CH' || countryCode === 'LI';
  },

  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        const taxRate = getTaxRate(context);

        DeliveryPricingAdapter.log(
          `DeliverySwissTax -> Tax Multiplicator: ${taxRate}`
        );

        pricingAdapter
          .calculationSheet()
          .filterBy({ isTaxable: true })
          .forEach(({ isNetPrice, ...row }) => {
            if (!isNetPrice) {
              const taxAmount = row.amount - row.amount / (1 + taxRate);
              pricingAdapter.resultSheet().calculation.push({
                ...row,
                amount: -taxAmount,
                isTaxable: false,
                isNetPrice: false,
                /* @ts-ignore */
                meta: { adapter: DeliverySwissTax.key },
              });
              pricingAdapter.resultSheet().addTax({
                amount: taxAmount,
                rate: taxRate,
                /* @ts-ignore */
                meta: { adapter: DeliverySwissTax.key },
              });
            } else {
              const taxAmount = row.amount * taxRate;
              pricingAdapter.resultSheet().addTax({
                amount: taxAmount,
                rate: taxRate,
                /* @ts-ignore */
                meta: { adapter: DeliverySwissTax.key },
              });
            }
          });

        return await pricingAdapter.calculate();
      },
    };
  },
};

DeliveryPricingDirector.registerAdapter(DeliverySwissTax);
