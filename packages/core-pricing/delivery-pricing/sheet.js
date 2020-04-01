import PricingSheet from '../pricing-sheet';

const DeliveryPricingSheetRowCategories = {
  Delivery: 'DELIVERY',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
};

class DeliveryPricingSheet extends PricingSheet {
  addDiscount({ amount, isTaxable, discountId, meta }) {
    this.calculation.push({
      category: DeliveryPricingSheetRowCategories.Discount,
      amount,
      isTaxable,
      discountId,
      meta,
    });
  }

  addFee({ amount, isTaxable, isNetPrice, meta }) {
    this.calculation.push({
      category: DeliveryPricingSheetRowCategories.Delivery,
      amount,
      isTaxable,
      isNetPrice,
      meta,
    });
  }

  addTax({ amount, rate, meta }) {
    this.calculation.push({
      category: DeliveryPricingSheetRowCategories.Tax,
      amount,
      rate,
      meta,
    });
  }

  taxSum() {
    return this.sum({
      category: DeliveryPricingSheetRowCategories.Tax,
    });
  }

  feeSum() {
    return this.sum({
      category: DeliveryPricingSheetRowCategories.Delivery,
    });
  }

  discountSum(discountId) {
    return this.sum({
      category: DeliveryPricingSheetRowCategories.Discount,
      discountId,
    });
  }

  discountPrices(explicitDiscountId) {
    const discountIds = this.getDiscountRows(explicitDiscountId).map(
      ({ discountId }) => discountId
    );

    return [...new Set(discountIds)].map((discountId) => ({
      discountId,
      amount: this.sum({
        category: DeliveryPricingSheetRowCategories.Discount,
        discountId,
      }),
      currency: this.currency,
    }));
  }

  getFeeRows() {
    return this.filterBy({ category: DeliveryPricingSheetRowCategories.Item });
  }

  getDiscountRows(discountId) {
    return this.filterBy({
      category: DeliveryPricingSheetRowCategories.Discount,
      discountId,
    });
  }

  getTaxRows() {
    return this.filterBy({ category: DeliveryPricingSheetRowCategories.Tax });
  }
}

export { DeliveryPricingSheet, DeliveryPricingSheetRowCategories };
