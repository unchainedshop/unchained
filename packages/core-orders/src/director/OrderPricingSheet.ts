import { BasePricingSheet } from 'meteor/unchained:utils';
import {
  OrderPricingCalculation,
  OrderPricingRowCategory,
} from '@unchainedshop/types/orders.pricing';
import { PricingSheetParams } from '@unchainedshop/types/pricing';

export const OrderPricingSheet = (
  params: PricingSheetParams<OrderPricingCalculation>
) => {
  const basePricingSheet = BasePricingSheet<OrderPricingCalculation>(params);

  const pricingSheet = {
    ...basePricingSheet,

    addItems({ amount, meta }: { amount: number; meta?: any }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Items,
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
        category: OrderPricingRowCategory.Discounts,
        amount,
        discountId,
        meta,
      });
    },

    addTaxes({ amount, meta }: { amount: number; meta?: any }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Taxes,
        amount,
        meta,
      });
    },

    addDelivery({ amount, meta }: { amount: number; meta?: any }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Delivery,
        amount,
        meta,
      });
    },

    addPayment({ amount, meta }: { amount: number; meta?: any }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Payment,
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
        category: OrderPricingRowCategory.Taxes,
      });
    },

    itemsSum(): number {
      return basePricingSheet.sum({
        category: OrderPricingRowCategory.Items,
      });
    },

    discountSum(discountId: string): number {
      return basePricingSheet.sum({
        category: OrderPricingRowCategory.Discounts,
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
            category: OrderPricingRowCategory.Discounts,
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
        category: OrderPricingRowCategory.Discounts,
        discountId,
      });
    },

    getItemsRows() {
      return basePricingSheet.filterBy({
        category: OrderPricingRowCategory.Items,
      });
    },

    getTaxesRows() {
      return basePricingSheet.filterBy({
        category: OrderPricingRowCategory.Taxes,
      });
    },

    getDeliveryRows() {
      return basePricingSheet.filterBy({
        category: OrderPricingRowCategory.Delivery,
      });
    },

    getPaymentRows() {
      return basePricingSheet.filterBy({
        category: OrderPricingRowCategory.Payment,
      });
    },
  };

  return pricingSheet;
};
