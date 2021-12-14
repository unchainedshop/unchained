import { BasePricingSheet, PricingSheetParams } from '../basePricing/BasePricingSheet';

export enum OrderPricingSheetRowCategory {
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

export const OrderPricingSheet = (
  params: PricingSheetParams<OrderPricingCalculation>
) => {
  const basePricingSheet = BasePricingSheet<
    OrderPricingSheetRowCategory,
    OrderPricingCalculation
  >(params);

  const pricingSheet = {
    ...basePricingSheet,
    addItems({ amount, meta }: { amount: number; meta?: any }) {
      basePricingSheet.calculation.push({
        category: OrderPricingSheetRowCategory.Items,
        amount,
        meta,
      });
    },

    addDiscounts({
      amount,
      discountId,
      meta,
    }: {
      amount: number;
      discountId: string;
      meta?: any;
    }) {
      basePricingSheet.calculation.push({
        category: OrderPricingSheetRowCategory.Discounts,
        amount,
        discountId,
        meta,
      });
    },

    addTaxes({ amount, meta }: { amount: number; meta?: any }) {
      basePricingSheet.calculation.push({
        category: OrderPricingSheetRowCategory.Taxes,
        amount,
        meta,
      });
    },

    addDelivery({ amount, meta }: { amount: number; meta?: any }) {
      basePricingSheet.calculation.push({
        category: OrderPricingSheetRowCategory.Delivery,
        amount,
        meta,
      });
    },

    addPayment({ amount, meta }: { amount: number; meta?: any }) {
      basePricingSheet.calculation.push({
        category: OrderPricingSheetRowCategory.Payment,
        amount,
        meta,
      });
    },

    gross(): number {
      // tax is included 2 times, this is only true for Order Pricing!
      return basePricingSheet.sum() - pricingSheet.taxSum();
    },

    taxSum(): number {
      return basePricingSheet.sum({
        category: OrderPricingSheetRowCategory.Taxes,
      });
    },

    itemsSum(): number {
      return basePricingSheet.sum({
        category: OrderPricingSheetRowCategory.Items,
      });
    },

    discountSum(discountId: string): number {
      return basePricingSheet.sum({
        category: OrderPricingSheetRowCategory.Discounts,
        discountId,
      });
    },

    discountPrices(
      explicitDiscountId: string
    ): Array<{ discountId: string; amount: number; currency: string }> {
      const discountIds = pricingSheet
        .getDiscountRows(explicitDiscountId)
        .map(({ discountId }) => discountId);

      return [...new Set(discountIds)]
        .map((discountId) => {
          const amount = basePricingSheet.sum({
            category: OrderPricingSheetRowCategory.Discounts,
            discountId,
          });
          if (!amount) {
            return null;
          }
          return {
            discountId,
            amount: Math.round(amount),
            currency: basePricingSheet.currency,
          };
        })
        .filter(Boolean);
    },

    getDiscountRows(discountId: string) {
      return basePricingSheet.filterBy({
        category: OrderPricingSheetRowCategory.Discounts,
        discountId,
      });
    },

    getItemsRows() {
      return basePricingSheet.filterBy({
        category: OrderPricingSheetRowCategory.Items,
      });
    },

    getTaxesRows() {
      return basePricingSheet.filterBy({
        category: OrderPricingSheetRowCategory.Taxes,
      });
    },

    getDeliveryRows() {
      return basePricingSheet.filterBy({
        category: OrderPricingSheetRowCategory.Delivery,
      });
    },

    getPaymentRows() {
      return basePricingSheet.filterBy({
        category: OrderPricingSheetRowCategory.Payment,
      });
    },
  };

  return pricingSheet;
};
