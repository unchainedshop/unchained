/* @ts-ignore */
import moment from 'moment';
import {
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
} from 'meteor/unchained:core-delivery';

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

const getTaxRate = (context) => {
  const date =
    context.order && context.order.ordered
      ? new Date(context.order.ordered)
      : new Date();

  // TODO: use modules
  /* @ts-ignore */
  const taxCategoryFromProvider = context.provider?.configuration?.find(
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

export const DeliverySwissTax = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-swiss-tax',
  version: '1.0',
  label: 'Apply Swiss Tax on Delivery Fees',
  orderIndex: 20,

  isActivatedFor: async (context) => {
    const address =
      // TODO: use modules
      /* @ts-ignore */
      context.order?.delivery()?.context?.address ||
      context.order?.billingAddress;
    const countryCode =
      address?.countryCode !== undefined
        ? address.countryCode?.toUpperCase().trim()
        : context.country?.toUpperCase().trim();
    return countryCode === 'CH' || countryCode === 'LI';
  },

  get: (params) => {
    const pricing = pricingAdapter.get(params);
    const { context, calculation } = params;

    return {
      calculate: async () => {
        const taxRate = getTaxRate(context);

        pricingAdapter.log(`DeliverySwissTax -> Tax Multiplicator: ${taxRate}`);

        pricing.calculationSheet
          .filterBy({ isTaxable: true })
          .forEach(({ isNetPrice, ...row }) => {
            if (!isNetPrice) {
              const taxAmount = row.amount - row.amount / (1 + taxRate);
              pricing.resultSheet.calculation.push({
                ...row,
                amount: -taxAmount,
                isTaxable: false,
                isNetPrice: false,
                /* @ts-ignore */
                meta: { adapter: this.constructor.key },
              });
              pricing.resultSheet.addTax({
                amount: taxAmount,
                rate: taxRate,
                /* @ts-ignore */
                meta: { adapter: this.constructor.key },
              });
            } else {
              const taxAmount = row.amount * taxRate;
              pricing.resultSheet.addTax({
                amount: taxAmount,
                rate: taxRate,
                /* @ts-ignore */
                meta: { adapter: this.constructor.key },
              });
            }
          });

        return await pricing.calculate();
      },
    };
  },
};

DeliveryPricingDirector.registerAdapter(DeliverySwissTax);
