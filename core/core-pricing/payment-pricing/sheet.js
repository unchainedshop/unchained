const PaymentPricingSheetRowCategories = {
  Payment: 'PAYMENT',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
};

class PaymentPricingSheet {
  constructor({ calculation, currency }) {
    this.calculation = calculation || [];
    this.currency = currency;
  }

  addPayment({ amount }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategories.Payment,
      amount,
    });
  }

  addTax({ amount }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategories.Tax,
      amount,
    });
  }

  taxSum() {
    return this.sum({ category: PaymentPricingSheetRowCategories.Tax });
  }

  discountPrices() {
    const discountIds = this
      .getDiscountRows()
      .map(({ discountId }) => discountId);

    return [...new Set(discountIds)].map(discountId => ({
      discountId,
      amount: this.sum({
        category: PaymentPricingSheetRowCategories.Discount,
        discountId,
      }),
      currency: this.currency,
    }));
  }

  discountSum(discountId) {
    return this.sum({
      category: PaymentPricingSheetRowCategories.Discount,
      discountId,
    });
  }

  gross() {
    return this.sum();
  }

  sum({ category } = {}) {
    return this.filterByCategory(category)
      .reduce((sum, calculationRow) => sum + calculationRow.amount, 0);
  }

  getDiscountRows() {
    return this.filterByCategory(PaymentPricingSheetRowCategories.Discount);
  }

  getPaymentRows() {
    return this.filterByCategory(PaymentPricingSheetRowCategories.Payment);
  }

  getTaxRows() {
    return this.filterByCategory(PaymentPricingSheetRowCategories.Tax);
  }

  filterByCategory(category) {
    return this.calculation
      .filter(calculationRow => (!category || calculationRow.category === category));
  }

  getRawPaymentPricingSheet() {
    return this.calculation;
  }
}

export { PaymentPricingSheet, PaymentPricingSheetRowCategories };
