import type { PricingCalculation } from '@unchainedshop/utils';

import {
  BasePricingSheet,
  type IPricingSheet,
  type IBasePricingSheet,
  type PricingSheetParams,
} from '../directors/index.ts';

export interface OrderPricingCalculation extends PricingCalculation {
  discountId?: string;
}

export const OrderPricingRowCategory = {
  Items: 'ITEMS',
  Discounts: 'DISCOUNTS',
  Taxes: 'TAXES',
  Delivery: 'DELIVERY',
  Payment: 'PAYMENT',
} as const;

export type OrderPricingRowCategory =
  (typeof OrderPricingRowCategory)[keyof typeof OrderPricingRowCategory];

export interface IOrderPricingSheet extends IPricingSheet<OrderPricingCalculation> {
  addDelivery: (params: { amount: number; taxAmount: number; meta?: any }) => void;
  addDiscount: (params: { amount: number; taxAmount: number; discountId: string; meta?: any }) => void;
  addItems: (params: { amount: number; taxAmount: number; meta?: any }) => void;
  addPayment: (params: { amount: number; taxAmount: number; meta?: any }) => void;
}

export const OrderPricingSheet = (
  params: PricingSheetParams<OrderPricingCalculation>,
): IOrderPricingSheet => {
  const basePricingSheet: IBasePricingSheet<OrderPricingCalculation> = BasePricingSheet(params);

  const addTaxIfAvailabile = (category: string, taxAmount?: number, meta?: any, discountId?: string) => {
    if (taxAmount) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Taxes,
        amount: taxAmount,
        baseCategory: category,
        discountId,
        meta,
      });
    }
  };

  const pricingSheet: IOrderPricingSheet = {
    ...basePricingSheet,

    addItems({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Items,
        amount,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Items, taxAmount, meta);
    },

    addDiscount({ amount, taxAmount, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Discounts,
        amount,
        discountId,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Discounts, taxAmount, meta, discountId);
    },

    addDelivery({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Delivery,
        amount,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Delivery, taxAmount, meta);
    },

    addPayment({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Payment,
        amount,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Payment, taxAmount, meta);
    },

    taxSum(filter) {
      return basePricingSheet.sum({
        category: OrderPricingRowCategory.Taxes,
        ...(filter || {}),
      });
    },

    discountSum(discountId) {
      return basePricingSheet.sum({
        category: OrderPricingRowCategory.Discounts,
        discountId,
      });
    },

    total({ category, useNetPrice, discountId } = { useNetPrice: false }) {
      const taxAmount = this.taxSum({ baseCategory: category, discountId });
      const amount = this.sum({ category, discountId }) - taxAmount;

      // Sum does not contain taxes when filtering by category, it's net in that case and gross if there is no category
      const netAmount = !category ? amount - taxAmount : amount;

      return {
        amount: Math.round(useNetPrice ? netAmount : netAmount + taxAmount),
        currencyCode: this.currencyCode,
      };
    },

    discountPrices(explicitDiscountId) {
      const discountIds = pricingSheet
        .filterBy({
          category: OrderPricingRowCategory.Discounts,
          discountId: explicitDiscountId,
        })
        .map(({ discountId }) => discountId)
        .filter(Boolean) as string[];

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
            currencyCode: basePricingSheet.currencyCode,
          };
        })
        .filter(Boolean) as { discountId: string; amount: number; currencyCode: string }[];
    },
  };

  return pricingSheet;
};
