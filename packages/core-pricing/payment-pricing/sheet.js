import PricingSheet from '../pricing-sheet';

const PaymentPricingSheetRowCategories = {
  Payment: 'PAYMENT',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
};

class PaymentPricingSheet extends PricingSheet {
  addFee({ amount, isTaxable, isNetPrice, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategories.Payment,
      amount,
      isTaxable,
      isNetPrice,
      meta,
    });
  }

  addDiscount({ amount, isTaxable, discountId, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategories.Discount,
      amount,
      isTaxable,
      discountId,
      meta,
    });
  }

  addTax({ amount, rate, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategories.Tax,
      amount,
      rate,
      meta,
    });
  }

  taxSum() {
    return this.sum({
      category: PaymentPricingSheetRowCategories.Tax,
    });
  }

  feeSum() {
    return this.sum({
      category: PaymentPricingSheetRowCategories.Payment,
    });
  }

  discountSum(discountId) {
    return this.sum({
      category: PaymentPricingSheetRowCategories.Discount,
      discountId,
    });
  }

  discountPrices(explicitDiscountId) {
    const discountIds = this.getDiscountRows(explicitDiscountId).map(
      ({ discountId }) => discountId
    );

    return [...new Set(discountIds)]
      .map((discountId) => {
        const amount = this.sum({
          category: PaymentPricingSheetRowCategories.Discount,
          discountId,
        });
        if (!amount) {
          return null;
        }
        return {
          discountId,
          amount,
          currency: this.currency,
        };
      })
      .filter(Boolean);
  }

  getFeeRows() {
    return this.filterBy({ category: PaymentPricingSheetRowCategories.Item });
  }

  getDiscountRows(discountId) {
    return this.filterBy({
      category: PaymentPricingSheetRowCategories.Discount,
      discountId,
    });
  }

  getTaxRows() {
    return this.filterBy({ category: PaymentPricingSheetRowCategories.Tax });
  }
}

export { PaymentPricingSheet, PaymentPricingSheetRowCategories };
