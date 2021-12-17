/* @ts-ignore */
import moment from 'moment';
import {
  DeliveryPricingDirector,
  DeliveryPricingAdapter,
} from 'meteor/unchained:director-pricing';

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

export class DeliverySwissTax extends DeliveryPricingAdapter {
  static key = 'shop.unchained.pricing.delivery-swiss-tax';

  static version = '1.0';

  static label = 'Apply Swiss Tax on Delivery Fees';

  static orderIndex = 20;

  static async isActivatedFor(context) {
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
  }

  getTaxRate() {
    const date =
      this.context.order && this.context.order.ordered
        ? new Date(this.context.order.ordered)
        : new Date();

    // TODO: use modules
    /* @ts-ignore */
    const taxCategoryFromProvider = this.context.provider?.configuration?.find(
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
  }

  async calculate() {
    const taxRate = this.getTaxRate();
    this.log(`DeliverySwissTax -> Tax Multiplicator: ${taxRate}`);
    this.calculation
      .filterBy({ isTaxable: true })
      .forEach(({ isNetPrice, ...row }) => {
        if (!isNetPrice) {
          const taxAmount = row.amount - row.amount / (1 + taxRate);
          this.result.calculation.push({
            ...row,
            amount: -taxAmount,
            isTaxable: false,
            isNetPrice: false,
            /* @ts-ignore */
            meta: { adapter: this.constructor.key },
          });
          this.result.addTax({
            amount: taxAmount,
            rate: taxRate,
            /* @ts-ignore */
            meta: { adapter: this.constructor.key },
          });
        } else {
          const taxAmount = row.amount * taxRate;
          this.result.addTax({
            amount: taxAmount,
            rate: taxRate,
            /* @ts-ignore */
            meta: { adapter: this.constructor.key },
          });
        }
      });

    return await super.calculate();
  }
}

DeliveryPricingDirector.registerAdapter(DeliverySwissTax);
