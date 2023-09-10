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

  const pricingSheet: IOrderPricingSheet = {
    ...basePricingSheet,

    addItems({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Items,
        amount,
        meta,
      });

      if (taxAmount !== 0) {
        basePricingSheet.calculation.push({
          category: OrderPricingRowCategory.Taxes,
          amount: taxAmount,
          baseCategory: OrderPricingRowCategory.Items,
          meta: { ...(meta || {}) },
        });
      }
    },

    addDiscount({ amount, taxAmount, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Discounts,
        amount,
        discountId,
        meta,
      });

      if (taxAmount !== 0) {
        basePricingSheet.calculation.push({
          category: OrderPricingRowCategory.Taxes,
          baseCategory: OrderPricingRowCategory.Discounts,
          amount: taxAmount,
          meta: { ...(meta || {}), discountId },
        });
      }
    },

    addDelivery({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Delivery,
        amount,
        meta,
      });

      if (taxAmount !== 0) {
        basePricingSheet.calculation.push({
          category: OrderPricingRowCategory.Taxes,
          amount: taxAmount,
          baseCategory: OrderPricingRowCategory.Delivery,
          meta: { ...(meta || {}) },
        });
      }
    },

    addPayment({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Payment,
        amount,
        meta,
      });

      if (taxAmount !== 0) {
        basePricingSheet.calculation.push({
          category: OrderPricingRowCategory.Taxes,
          amount: taxAmount,
          baseCategory: OrderPricingRowCategory.Payment,
          meta: { ...(meta || {}) },
        });
      }
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

    getDiscountRows(discountId) {
      return basePricingSheet.filterBy({
        category: OrderPricingRowCategory.Discounts,
        discountId,
      });
    },
  };

  return pricingSheet;
};
