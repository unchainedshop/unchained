import { PricingSheet } from '../pricing-sheet';

export enum DeliveryPricingSheetRowCategory {
  Delivery = 'DELIVERY',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
  Item = 'ITEM', // Propably unused
}

interface Calculation<Category> {
  amount: number;
  category: Category;
  discountId?: string;
  isNetPrice: boolean;
  isTaxable: boolean;
  meta?: any;
  rate?: number;
}

export type DeliveryPricingCalculation =
  Calculation<DeliveryPricingSheetRowCategory>;

export class DeliveryPricingSheet extends PricingSheet<
  DeliveryPricingSheetRowCategory,
  DeliveryPricingCalculation
> {
  addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
    this.calculation.push({
      category: DeliveryPricingSheetRowCategory.Discount,
      amount,
      isTaxable,
      isNetPrice,
      discountId,
      meta,
    });
  }

  addFee({ amount, isTaxable, isNetPrice, meta }) {
    this.calculation.push({
      amount,
      category: DeliveryPricingSheetRowCategory.Delivery,
      isNetPrice,
      isTaxable,
      meta,
    });
  }

  addTax({ amount, rate, meta }) {
    this.calculation.push({
      amount,
      category: DeliveryPricingSheetRowCategory.Tax,
      isNetPrice: false,
      isTaxable: false,
      meta,
      rate,
    });
  }

  taxSum() {
    return this.sum({
      category: DeliveryPricingSheetRowCategory.Tax,
    });
  }

  feeSum() {
    return this.sum({
      category: DeliveryPricingSheetRowCategory.Delivery,
    });
  }

  discountSum(discountId: string) {
    return this.sum({
      category: DeliveryPricingSheetRowCategory.Discount,
      discountId,
    });
  }

  discountPrices(explicitDiscountId: string) {
    const discountIds = this.getDiscountRows(explicitDiscountId).map(
      ({ discountId }) => discountId
    );

    return [...new Set(discountIds)]
      .map((discountId) => {
        const amount = this.sum({
          category: DeliveryPricingSheetRowCategory.Discount,
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
    return this.filterBy({ category: DeliveryPricingSheetRowCategory.Item });
  }

  getDiscountRows(discountId) {
    return this.filterBy({
      category: DeliveryPricingSheetRowCategory.Discount,
      discountId,
    });
  }

  getTaxRows() {
    return this.filterBy({ category: DeliveryPricingSheetRowCategory.Tax });
  }
}
