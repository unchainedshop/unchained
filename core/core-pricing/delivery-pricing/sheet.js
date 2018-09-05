import PricingSheet from '../pricing-sheet';

const DeliveryPricingSheetRowCategories = {
  Delivery: 'DELIVERY',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
};

class DeliveryPricingSheet extends PricingSheet {
  addDelivery({
    amount, isTaxable, isNetPrice, meta,
  }) {
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

  deliverySum() {
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

  discountPrices() {
    const discountIds = this
      .getDiscountRows()
      .map(({ discountId }) => discountId);

    return [...new Set(discountIds)].map(discountId => ({
      discountId,
      amount: this.sum({
        category: DeliveryPricingSheetRowCategories.Discount,
        discountId,
      }),
      currency: this.currency,
    }));
  }

  getDeliveryRows() {
    return this.filterBy({ category: DeliveryPricingSheetRowCategories.Item });
  }

  getDiscountRows() {
    return this.filterBy({ category: DeliveryPricingSheetRowCategories.Discount });
  }

  getTaxRows() {
    return this.filterBy({ category: DeliveryPricingSheetRowCategories.Tax });
  }
}

export { DeliveryPricingSheet, DeliveryPricingSheetRowCategories };
