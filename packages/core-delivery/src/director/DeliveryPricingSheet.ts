import { BasePricingSheet } from '@unchainedshop/utils';
import {
  DeliveryPricingCalculation,
  DeliveryPricingRowCategory,
  IDeliveryPricingSheet,
} from '@unchainedshop/types/delivery.pricing.js';
import { IBasePricingSheet, PricingSheetParams } from '@unchainedshop/types/pricing.js';

export const DeliveryPricingSheet = (
  params: PricingSheetParams<DeliveryPricingCalculation>,
): IDeliveryPricingSheet => {
  const basePricingSheet: IBasePricingSheet<DeliveryPricingCalculation> = BasePricingSheet(params);

  const pricingSheet: IDeliveryPricingSheet = {
    ...basePricingSheet,

    addDiscount({ amount, isTaxable, isNetPrice, taxAmount, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: DeliveryPricingRowCategory.Discount,
        amount,
        isTaxable: taxAmount ? false : isTaxable,
        isNetPrice,
        discountId,
        meta,
      });

      if (taxAmount) {
        basePricingSheet.calculation.push({
          category: DeliveryPricingRowCategory.Tax,
          baseCategory: DeliveryPricingRowCategory.Discount,
          amount,
          isTaxable: false,
          isNetPrice: false,
          meta,
        });
      }
    },

    addFee({ amount, isTaxable, isNetPrice, meta }) {
      basePricingSheet.calculation.push({
        amount,
        category: DeliveryPricingRowCategory.Delivery,
        isNetPrice,
        isTaxable,
        meta,
      });
    },

    addTax({ amount, rate, meta }) {
      basePricingSheet.calculation.push({
        amount,
        category: DeliveryPricingRowCategory.Tax,
        isNetPrice: false,
        isTaxable: false,
        meta,
        rate,
      });
    },

    taxSum() {
      return basePricingSheet.sum({
        category: DeliveryPricingRowCategory.Tax,
      });
    },

    feeSum() {
      return basePricingSheet.sum({
        category: DeliveryPricingRowCategory.Delivery,
      });
    },

    discountSum(discountId) {
      return basePricingSheet.sum({
        category: DeliveryPricingRowCategory.Discount,
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
            category: DeliveryPricingRowCategory.Discount,
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
        category: DeliveryPricingRowCategory.Discount,
        discountId,
      });
    },
  };

  return pricingSheet;
};
