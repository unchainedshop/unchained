import { BasePricingSheet } from '../BasePricingSheet';

enum PaymentPricingSheetRowCategory {
  Item = 'ITEM',
  Payment = 'PAYMENT',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
};

interface Calculation<Category> {
  amount: number;
  category: Category;
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
  meta?: any;
}

export type PaymentPricingCalculation = Calculation<PaymentPricingSheetRowCategory>;


class PaymentPricingSheet extends BasePricingSheet<PaymentPricingSheetRowCategory, PaymentPricingCalculation> {
  addFee({ amount, isTaxable, isNetPrice, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategory.Payment,
      amount,
      isTaxable,
      isNetPrice,
      meta,
    });
  }

  addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategory.Discount,
      amount,
      isTaxable,
      isNetPrice,
      discountId,
      meta,
    });
  }

  addTax({ amount, rate, meta }) {
    this.calculation.push({
      category: PaymentPricingSheetRowCategory.Tax,
      amount,
      isTaxable: false,
      isNetPrice: false,
      rate,
      meta,
    });
  }

  taxSum() {
    return this.sum({
      category: PaymentPricingSheetRowCategory.Tax,
    });
  }

  feeSum() {
    return this.sum({
      category: PaymentPricingSheetRowCategory.Payment,
    });
  }

  discountSum(discountId) {
    return this.sum({
      category: PaymentPricingSheetRowCategory.Discount,
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
          category: PaymentPricingSheetRowCategory.Discount,
          discountId,
        });
        if (!amount) {
          return null;
        }
        return {
          discountId,
          amount: Math.round(amount),
          currency: this.currency,
        };
      })
      .filter(Boolean);
  }

  getFeeRows() {
    return this.filterBy({ category: PaymentPricingSheetRowCategory.Item });
  }

  getDiscountRows(discountId) {
    return this.filterBy({
      category: PaymentPricingSheetRowCategory.Discount,
      discountId,
    });
  }

  getTaxRows() {
    return this.filterBy({ category: PaymentPricingSheetRowCategory.Tax });
  }
}

export { PaymentPricingSheet, PaymentPricingSheetRowCategory };
