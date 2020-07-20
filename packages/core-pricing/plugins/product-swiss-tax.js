import moment from 'moment';
import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

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
    tag: 'swiss-tax-category:reduced',
    rate: () => {
      return 0.025;
    },
  },
  SPECIAL: {
    tag: 'swiss-tax-category:special',
    rate: () => {
      return 0.037;
    },
  },
};

export class ProductSwissTax extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.product-swiss-tax';

  static version = '1.0';

  static label =
    'Berechnung der Bestellposition: Nettopreis und MwSt (Schweiz)';

  static orderIndex = 20;

  static isActivatedFor(ctx) {
    if (ctx.country === 'CH') {
      return true; // check if delivery address is in switzerland?
    }
    return false;
  }

  getTaxRate() {
    const date =
      this.context.order && this.context.order.ordered
        ? new Date(this.context.order.ordered)
        : new Date();
    const { product } = this.context;

    if (product.tags?.includes(SwissTaxCategories.REDUCED.tag)) {
      return SwissTaxCategories.REDUCED.rate(date);
    }
    if (product.tags?.includes(SwissTaxCategories.SPECIAL.tag)) {
      return SwissTaxCategories.SPECIAL.rate(date);
    }
    return SwissTaxCategories.DEFAULT.rate(date);
  }

  async calculate() {
    const taxRate = this.getTaxRate();
    this.log(`ProductSwissTax -> Tax Multiplicator: ${taxRate}`);
    this.calculation
      .filterBy({ isTaxable: true })
      .forEach(({ isNetPrice, ...row }) => {
        if (!isNetPrice) {
          const taxAmount = row.amount - row.amount / (1 + taxRate);
          this.result.calculation.push({
            ...row,
            amount: -taxAmount,
            isTaxable: false,
            meta: { adapter: this.constructor.key },
          });
          this.result.addTax({
            amount: taxAmount,
            rate: taxRate,
            meta: { adapter: this.constructor.key },
          });
        } else {
          const taxAmount = row.amount * taxRate;
          this.result.addTax({
            amount: taxAmount,
            rate: taxRate,
            meta: { adapter: this.constructor.key },
          });
        }
      });
    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductSwissTax);
