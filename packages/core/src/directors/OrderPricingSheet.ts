import type { PricingCalculation } from '@unchainedshop/utils';

import {
  BasePricingSheet,
  type IPricingSheet,
  type IBasePricingSheet,
  type PricingSheetParams,
} from './BasePricingSheet.ts';

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
  discountSum: (discountId?: string) => number;
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
        isNetPrice: false,
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
        isNetPrice: true,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Items, taxAmount, meta);
    },

    addDiscount({ amount, taxAmount, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Discounts,
        amount,
        discountId,
        isNetPrice: true,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Discounts, taxAmount, meta, discountId);
    },

    addDelivery({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Delivery,
        amount,
        isNetPrice: true,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Delivery, taxAmount, meta);
    },

    addPayment({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Payment,
        amount,
        isNetPrice: true,
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
          const amount =
            pricingSheet.sum({
              category: OrderPricingRowCategory.Discounts,
              discountId,
            }) +
            pricingSheet.taxSum({
              baseCategory: OrderPricingRowCategory.Discounts,
              discountId,
            });
          if (!amount) {
            return null;
          }
          return {
            discountId,
            amount: Math.round(amount),
            currencyCode: pricingSheet.currencyCode,
          };
        })
        .filter(Boolean) as { discountId: string; amount: number; currencyCode: string }[];
    },
  };

  return pricingSheet;
};
