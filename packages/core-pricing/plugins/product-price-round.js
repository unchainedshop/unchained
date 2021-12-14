import { ProductPricingAdapter } from 'meteor/unchained:core-pricing';

const roundToNext = (value, precision) =>
  value % precision === precision / 2
    ? value + precision / 2
    : value + (precision - (value % precision));

class ProductPriceRound extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-round';

  static version = '1.0';

  static label = 'Round product price to the next precision number';

  static orderIndex = 2;

  static configurations = {};

  static skip = [];

  static defaultPrecision = 50;

  static async isActivatedFor() {
    return true;
  }

  static configure({ defaultPrecision, configurations, skip }) {
    if (defaultPrecision) this.defaultPrecision = defaultPrecision;
    if (configurations) this.configurations = configurations;
    if (skip?.length) this.skip = skip;
  }

  async calculate() {
    const { currency, quantity } = this.context;
    const { configurations, skip, defaultPrecision } = ProductPriceRound;
    const { calculation = [] } = this.calculation;

    if (skip?.indexOf(currency) !== -1) return super.calculate();

    const roundPrecision = configurations?.[currency] || defaultPrecision;

    if (calculation?.length && roundPrecision) {
      const [productPrice] = calculation;
      this.resetCalculation();
      this.result.addItem({
        amount: roundToNext(productPrice.amount, roundPrecision) * quantity,
        isTaxable: productPrice.isTaxable,
        isNetPrice: productPrice.isNetPrice,
        /* @ts-ignore */
        meta: { adapter: this.constructor.key },
      });
    }

    return super.calculate();
  }
}

export default ProductPriceRound;
