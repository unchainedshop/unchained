import { BasePricingSheet } from '../BasePricingSheet';

enum OrderPricingSheetRowCategory {
  Items = 'ITEMS',
  Discounts = 'DISCOUNTS',
  Taxes = 'TAXES',
  Delivery = 'DELIVERY',
  Payment = 'PAYMENT',
}

interface Calculation<Category> {
  amount: number;
  category: Category;
  discountId?: string;
  meta?: any;
}

export type OrderPricingCalculation = Calculation<OrderPricingSheetRowCategory>;

export class OrderPricingSheet extends BasePricingSheet<
  OrderPricingSheetRowCategory,
  OrderPricingCalculation
> {
  addItems({ amount, meta }: { amount: number; meta?: any }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategory.Items,
      amount,
      meta,
    });
  }

  addDiscounts({
    amount,
    discountId,
    meta,
  }: {
    amount: number;
    discountId: string;
    meta?: any;
  }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategory.Discounts,
      amount,
      discountId,
      meta,
    });
  }

  addTaxes({ amount, meta }: { amount: number; meta?: any }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategory.Taxes,
      amount,
      meta,
    });
  }

  addDelivery({ amount, meta }: { amount: number; meta?: any }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategory.Delivery,
      amount,
      meta,
    });
  }

  addPayment({ amount, meta }: { amount: number; meta?: any }) {
    this.calculation.push({
      category: OrderPricingSheetRowCategory.Payment,
      amount,
      meta,
    });
  }

  gross(): number {
    // tax is included 2 times, this is only true for Order Pricing!
    return this.sum() - this.taxSum();
  }

  taxSum(): number {
    return this.sum({
      category: OrderPricingSheetRowCategory.Taxes,
    });
  }

  itemsSum(): number {
    return this.sum({
      category: OrderPricingSheetRowCategory.Items,
    });
  }

  discountSum(discountId: string): number {
    return this.sum({
      category: OrderPricingSheetRowCategory.Discounts,
      discountId,
    });
  }

  discountPrices(
    explicitDiscountId: string
  ): Array<{ discountId: string; amount: number; currency: string }> {
    const discountIds = this.getDiscountRows(explicitDiscountId).map(
      ({ discountId }) => discountId
    );

    return [...new Set(discountIds)]
      .map((discountId) => {
        const amount = this.sum({
          category: OrderPricingSheetRowCategory.Discounts,
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

  getDiscountRows(discountId: string) {
    return this.filterBy({
      category: OrderPricingSheetRowCategory.Discounts,
      discountId,
    });
  }

  getItemsRows() {
    return this.filterBy({ category: OrderPricingSheetRowCategory.Items });
  }

  getTaxesRows() {
    return this.filterBy({
      category: OrderPricingSheetRowCategory.Taxes,
    });
  }

  getDeliveryRows() {
    return this.filterBy({
      category: OrderPricingSheetRowCategory.Delivery,
    });
  }

  getPaymentRows() {
    return this.filterBy({
      category: OrderPricingSheetRowCategory.Payment,
    });
  }
}
