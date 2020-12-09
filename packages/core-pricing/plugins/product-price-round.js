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

  static configuration = {};

  static isActivatedFor() {
    return true;
  }

  static configure({ currency, precision }) {
    this.configuration[currency] = precision;
  }

  async calculate() {
    const { currency, quantity } = this.context;
    const { configuration } = this.constructor;
    const roundPrecision = configuration?.[currency] || configuration?.default;

    if (
      this.calculation?.calculation?.length &&
      roundPrecision &&
      configuration?.skip?.indexOf(currency) === -1
    ) {
      const [productPrice] = this.calculation?.calculation;
      this.resetCalculation();
      this.result.addItem({
        amount: roundToNext(productPrice.amount, roundPrecision) * quantity,
        isTaxable: productPrice.isTaxable,
        isNetPrice: productPrice.isNetPrice,
        meta: { adapter: this.constructor.key },
      });
    }

    return super.calculate();
  }
}

export default ProductPriceRound;
