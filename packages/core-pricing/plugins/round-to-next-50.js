import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

const roundToNext50 = (x) => (x % 50 === 25 ? x + 25 : x + (50 - (x % 50)));

class ProductPriceRoundTo50 extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.price-round-to-50';

  static version = '1.0';

  static label = 'Round product price to the next 50th number';

  static orderIndex = 2;

  static isActivatedFor() {
    return true;
  }

  async calculate() {
    const { product, country, currency } = this.context;
    const productPrice = product.price({ country, currency });
    if (!productPrice || !productPrice?.amount) return super.calculate();

    this.resetCalculation();
    this.result.addItem({
      amount: roundToNext50(productPrice.amount),
      isTaxable: productPrice.isTaxable,
      isNetPrice: productPrice.isNetPrice,
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductPriceRoundTo50);
