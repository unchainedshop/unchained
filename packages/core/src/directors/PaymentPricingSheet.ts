import { type PaymentPricingCalculation, type IPaymentPricingSheet } from './PaymentPricingAdapter.ts';
import {
  BasePricingSheet,
  type IBasePricingSheet,
  type PricingDiscount,
  type PricingSheetParams,
} from './BasePricingSheet.ts';

export const PaymentPricingRowCategory = {
  Item: 'ITEM',
  Payment: 'PAYMENT',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
} as const;

export type PaymentPricingRowCategory =
  (typeof PaymentPricingRowCategory)[keyof typeof PaymentPricingRowCategory];

export const PaymentPricingSheet = (
  params: PricingSheetParams<PaymentPricingCalculation>,
): IPaymentPricingSheet => {
  const basePricingSheet: IBasePricingSheet<PaymentPricingCalculation> = BasePricingSheet(params);

  const pricingSheet: IPaymentPricingSheet = {
    ...basePricingSheet,

    addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingRowCategory.Discount,
        amount,
        isTaxable,
        isNetPrice,
        discountId,
        meta,
      });
    },

    addFee({ amount, isTaxable, isNetPrice, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingRowCategory.Payment,
        amount,
        isTaxable,
        isNetPrice,
        meta,
      });
    },

    addTax({ amount, rate, baseCategory, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingRowCategory.Tax,
        amount,
        baseCategory,
        discountId,
        isTaxable: false,
        isNetPrice: false,
        rate,
        meta,
      });
    },

    taxSum(filter) {
      return basePricingSheet.sum({
        category: PaymentPricingRowCategory.Tax,
        ...(filter || {}),
      });
    },

    discountPrices(explicitDiscountId) {
      const discountIds = pricingSheet
        .filterBy({
          category: PaymentPricingRowCategory.Discount,
          discountId: explicitDiscountId,
        })
        .map(({ discountId }) => discountId)
        .filter(Boolean) as string[];

      return [...new Set(discountIds)]
        .map((discountId) => {
          // gross: the discount rows plus the tax attributed to the discount
          const taxAmount = pricingSheet.taxSum({
            baseCategory: PaymentPricingRowCategory.Discount,
            discountId,
          });
          const amount =
            pricingSheet.sum({ category: PaymentPricingRowCategory.Discount, discountId }) + taxAmount;
          if (!amount) {
            return null;
          }
          return {
            discountId,
            amount: Math.round(amount),
            currencyCode: pricingSheet.currencyCode,
            isTaxable: taxAmount !== 0,
            isNetPrice: false,
          };
        })
        .filter(Boolean) as PricingDiscount[];
    },
  };

  return pricingSheet;
};
