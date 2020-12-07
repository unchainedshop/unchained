import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

const roundToNext = (value, precision) =>
  value % precision === precision / 2
    ? value + precision / 2
    : value + (precision - (value % precision));

class ProductPriceRound extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-round';

  static version = '1.0';

  static label = 'Round product price to the next precision number';

  static orderIndex = 2;

  constructor(args) {
    super(args);
    this.configuration = {};
  }

  static isActivatedFor() {
    return true;
  }

  configure({ currency, precision }) {
    this.configuration[currency] = precision;
  }

  async calculate() {
    const { product, country, currency, quantity } = this.context;
    const roundPrecision =
      this.configuration?.[currency] || this.configuration?.default;
    if (!roundPrecision) return super.calculate();
    const productPrice = product.price({ country, currency });
    if (!productPrice || !productPrice?.amount) return super.calculate();

    this.resetCalculation();
    this.result.addItem({
      amount: roundToNext(productPrice.amount, roundPrecision) * quantity,
      isTaxable: productPrice.isTaxable,
      isNetPrice: productPrice.isNetPrice,
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductPriceRound);
