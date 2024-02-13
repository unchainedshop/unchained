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

    addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: DeliveryPricingRowCategory.Discount,
        amount,
        isTaxable,
        isNetPrice,
        discountId,
        meta,
      });
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

    taxSum(filter) {
      return basePricingSheet.sum({
        category: DeliveryPricingRowCategory.Tax,
        ...(filter || {}),
      });
    },

    discountPrices(explicitDiscountId) {
      const discountIds = pricingSheet
        .filterBy({
          category: DeliveryPricingRowCategory.Discount,
          discountId: explicitDiscountId,
        })
        .map(({ discountId }) => discountId);

      return [...new Set(discountIds)]
        .map((discountId) => {
          const amount = basePricingSheet.total({
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
  };

  return pricingSheet;
};
