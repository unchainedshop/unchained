import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

class ProductPrice extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.product-price';

  static version = '1.0';

  static label = 'Add Gross Price to Product';

  static orderIndex = 0;

  static isActivatedFor() {
    return true;
  }

  async calculate() {
    const { product, country, quantity } = this.context;

    const price = product.price({ country });
    if (price === null || price === undefined) return null;
    const itemTotal = price.amount * quantity;

    this.result.addItem({
      amount: itemTotal,
      isTaxable: price.isTaxable,
      isNetPrice: price.isNetPrice,
      meta: { adapter: this.constructor.key },
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductPrice);
