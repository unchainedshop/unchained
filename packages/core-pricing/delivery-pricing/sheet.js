import PricingSheet from '../pricing-sheet';

const DeliveryPricingSheetRowCategories = {
  Delivery: 'DELIVERY',
  Discount: 'DISCOUNT',
  Tax: 'TAX'
};

class DeliveryPricingSheet extends PricingSheet {
  addDiscount({ amount, isTaxable, discountId, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategories.Discount,
      amount,
      isTaxable,
      discountId,
      meta
    });
  }

  addFee({ amount, isTaxable, isNetPrice, meta }) {
    this.calculation.push({
      category: DeliveryPricingSheetRowCategories.Delivery,
      amount,
      isTaxable,
      isNetPrice,
      meta
    });
  }

  addTax({ amount, rate, meta }) {
    this.calculation.push({
      category: DeliveryPricingSheetRowCategories.Tax,
      amount,
      rate,
      meta
    });
  }

  taxSum() {
    return this.sum({
      category: DeliveryPricingSheetRowCategories.Tax
    });
  }

  feeSum() {
    return this.sum({
      category: DeliveryPricingSheetRowCategories.Delivery
    });
  }

  discountSum(discountId) {
    return this.sum({
      category: DeliveryPricingSheetRowCategories.Discount,
      discountId
    });
  }

  discountPrices() {
    const discountIds = this.getDiscountRows().map(
      ({ discountId }) => discountId
    );

    return [...new Set(discountIds)].map(discountId => ({
      discountId,
      amount: this.sum({
        category: DeliveryPricingSheetRowCategories.Discount,
        discountId
      }),
      currency: this.currency
    }));
  }

  getFeeRows() {
    return this.filterBy({ category: DeliveryPricingSheetRowCategories.Item });
  }

  getDiscountRows() {
    return this.filterBy({
      category: DeliveryPricingSheetRowCategories.Discount
    });
  }

  getTaxRows() {
    return this.filterBy({ category: DeliveryPricingSheetRowCategories.Tax });
  }
}

export { DeliveryPricingSheet, DeliveryPricingSheetRowCategories };
