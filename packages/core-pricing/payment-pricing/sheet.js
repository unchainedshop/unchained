import PricingSheet from '../pricing-sheet';

const PaymentPricingSheetRowCategories = {
  Payment: 'PAYMENT',
  Discount: 'DISCOUNT',
  Tax: 'TAX'
};

class PaymentPricingSheet extends PricingSheet {
  addPayment({ amount, isTaxable, isNetPrice, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategories.Payment,
      amount,
      isTaxable,
      isNetPrice,
      meta
    });
  }

  addTax({ amount, rate, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategories.Tax,
      amount,
      rate,
      meta
    });
  }

  taxSum() {
    return this.sum({
      category: PaymentPricingSheetRowCategories.Tax
    });
  }

  paymentSum() {
    return this.sum({
      category: PaymentPricingSheetRowCategories.Payment
    });
  }

  discountSum(discountId) {
    return this.sum({
      category: PaymentPricingSheetRowCategories.Discount,
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
        category: PaymentPricingSheetRowCategories.Discount,
        discountId
      }),
      currency: this.currency
    }));
  }

  getPaymentRows() {
    return this.filterBy({ category: PaymentPricingSheetRowCategories.Item });
  }

  getDiscountRows() {
    return this.filterBy({
      category: PaymentPricingSheetRowCategories.Discount
    });
  }

  getTaxRows() {
    return this.filterBy({ category: PaymentPricingSheetRowCategories.Tax });
  }
}

export { PaymentPricingSheet, PaymentPricingSheetRowCategories };
