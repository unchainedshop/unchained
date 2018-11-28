import {
  ProductPricingDirector,
  ProductPricingAdapter,
  ProductPricingSheetRowCategories,
} from 'meteor/unchained:core-pricing';

class ProductDiscount extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.product-discount'

  static version = '1.0'

  static label = 'Berechnung der Bestellposition: Prozentual-Gutscheine'

  static orderIndex = 10

  static isActivatedFor() {
    return true;
  }

  async calculate() {
    const {
      quantity,
    } = this.context;

    const taxableTotal = this.calculation.sum({
      category: ProductPricingSheetRowCategories.Item,
      isTaxable: true,
    });
    const nonTaxableTotal = this.calculation.sum({
      category: ProductPricingSheetRowCategories.Item,
      isTaxable: false,
    });

    this.discounts.forEach(({ configuration, discountId }) => {
      if (taxableTotal !== 0) {
        const amount = configuration.rate
          ? taxableTotal * configuration.rate
          : Math.min(configuration.fixedRate, taxableTotal);
        this.result.addDiscount({
          amount: amount * quantity * -1,
          isTaxable: true,
          discountId,
          meta: { adapter: this.constructor.key },
        });
      }
      if (nonTaxableTotal !== 0) {
        const amount = configuration.rate
          ? nonTaxableTotal * configuration.rate
          : Math.min(configuration.fixedRate, nonTaxableTotal);
        this.result.addDiscount({
          amount: amount * quantity * -1,
          isTaxable: false,
          discountId,
          meta: { adapter: this.constructor.key },
        });
      }
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductDiscount);
