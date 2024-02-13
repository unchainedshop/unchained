import { BasePricingSheet } from '@unchainedshop/utils';
import {
  OrderPricingCalculation,
  OrderPricingRowCategory,
  IOrderPricingSheet,
} from '@unchainedshop/types/orders.pricing.js';
import { IBasePricingSheet, PricingSheetParams } from '@unchainedshop/types/pricing.js';

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

    gross() {
      // tax is included 2 times, this is only true for Order Pricing!
      return basePricingSheet.sum() - this.taxSum();
    },

    net() {
      return basePricingSheet.sum() - this.taxSum() - this.taxSum();
    },

    total({ category, useNetPrice } = { useNetPrice: false }) {
      if (!category) {
        // WORKAROUND WHEN NO CATEGORY IS GIVEN
        return {
          amount: Math.round(useNetPrice ? this.net() : this.gross()),
          currency: params.currency,
        };
      }

      const grossAmountForCategory = this.sum({ category });
      const taxAmountForCategory = this.taxSum({ baseCategory: category });
      const amount = Math.round(
        useNetPrice ? grossAmountForCategory - taxAmountForCategory : grossAmountForCategory,
      );
      return {
        amount,
        currency: params.currency,
      };
    },

    discountPrices(explicitDiscountId) {
      const discountIds = pricingSheet
        .filterBy({
          category: OrderPricingRowCategory.Discounts,
          discountId: explicitDiscountId,
        })
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
  };

  return pricingSheet;
};
