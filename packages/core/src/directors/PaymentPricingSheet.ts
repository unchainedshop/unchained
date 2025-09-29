import {
  PaymentPricingCalculation,
  IPaymentPricingSheet,
  BasePricingSheet,
  IBasePricingSheet,
  PricingSheetParams,
} from '../directors/index.js';

export enum PaymentPricingRowCategory {
  Item = 'ITEM',
  Payment = 'PAYMENT',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
}

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

    addTax({ amount, rate, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingRowCategory.Tax,
        amount,
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
          const amount = basePricingSheet.sum({
            category: PaymentPricingRowCategory.Discount,
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
