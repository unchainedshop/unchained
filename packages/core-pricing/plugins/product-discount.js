import {
  Discount,
  DiscountConfiguration,
} from '@unchainedshop/types/discounting';
import {
  ProductPricingDirector,
  ProductPricingAdapter,
  ProductPricingSheetRowCategory,
} from 'meteor/unchained:core-pricing';

const applyRate = (
  { rate, fixedRate },
  amount
) => (rate ? amount * rate : Math.min(fixedRate, amount));

class ProductDiscount extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.product-discount';

  static version = '1.0';

  static label = 'Apply Discounts on Product Price';

  static orderIndex = 10;

  static async isActivatedFor() {
    return true;
  }

  addDiscount(discount, total, isTaxable) {
    const { configuration, discountId } = discount;
    const { isNetPrice = false, ...meta } = configuration;
    const amount = applyRate(configuration, total);
    this.result.addDiscount({
      amount: amount * -1,
      discountId,
      isNetPrice,
      isTaxable,
      // @ts-ignore */
      meta: { adapter: this.constructor.key, ...meta },
    });
  }

  async calculate() {
    const taxableTotal = this.calculation.sum({
      category: ProductPricingSheetRowCategory.Item,
      isTaxable: true,
    });
    const nonTaxableTotal = this.calculation.sum({
      category: ProductPricingSheetRowCategory.Item,
      isTaxable: false,
    });

    this.discounts.forEach((discount) => {
      if (taxableTotal !== 0) {
        this.addDiscount(discount, taxableTotal, true);
      }
      if (nonTaxableTotal !== 0) {
        this.addDiscount(discount, nonTaxableTotal, false);
      }
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductDiscount);
