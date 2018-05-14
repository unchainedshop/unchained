const DeliveryPricingSheetRowCategories = {
  Delivery: 'DELIVERY',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
};

class DeliveryPricingSheet {
  constructor({ calculation, currency }) {
    this.calculation = calculation || [];
    this.currency = currency;
  }

  addDelivery({ amount }) {
    this.calculation.push({
      category: DeliveryPricingSheetRowCategories.Delivery,
      amount,
    });
  }

  addTax({ amount }) {
    this.calculation.push({
      category: DeliveryPricingSheetRowCategories.Tax,
      amount,
    });
  }

  taxSum() {
    return this.sum({ category: DeliveryPricingSheetRowCategories.Tax });
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

  gross() {
    return this.sum();
  }

  sum({ category } = {}) {
    return this.filterByCategory(category)
      .reduce((sum, calculationRow) => sum + calculationRow.amount, 0);
  }

  getDeliveryRows() {
    return this.filterByCategory(DeliveryPricingSheetRowCategories.Delivery);
  }

  getDiscountRows() {
    return this.filterByCategory(DeliveryPricingSheetRowCategories.Discount);
  }

  getTaxRows() {
    return this.filterByCategory(DeliveryPricingSheetRowCategories.Tax);
  }

  filterByCategory(category) {
    return this.calculation
      .filter(calculationRow => (!category || calculationRow.category === category));
  }

  getRawDeliveryPricingSheet() {
    return this.calculation;
  }
}

export { DeliveryPricingSheet, DeliveryPricingSheetRowCategories };
