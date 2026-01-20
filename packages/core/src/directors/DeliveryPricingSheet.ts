import {
  BasePricingSheet,
  type IBasePricingSheet,
  type PricingSheetParams,
} from './BasePricingSheet.ts';
import type { DeliveryPricingCalculation, IDeliveryPricingSheet } from './DeliveryPricingAdapter.ts';

export const DeliveryPricingRowCategory = {
  Delivery: 'DELIVERY',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
  Item: 'ITEM', // Propably unused
} as const;

export type DeliveryPricingRowCategory =
  (typeof DeliveryPricingRowCategory)[keyof typeof DeliveryPricingRowCategory];

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
        .map(({ discountId }) => discountId)
        .filter(Boolean) as string[];

      return [...new Set(discountIds)]
        .map((discountId) => {
          const { currencyCode, amount } = basePricingSheet.total({
            category: DeliveryPricingRowCategory.Discount,
            discountId,
          });
          if (!amount) {
            return null;
          }
          return {
            discountId,
            amount: Math.round(amount),
            currencyCode,
          };
        })
        .filter(Boolean) as { discountId: string; amount: number; currencyCode: string }[];
    },
  };

  return pricingSheet;
};
