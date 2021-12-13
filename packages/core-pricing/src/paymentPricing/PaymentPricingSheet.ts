import { BasePricingSheet, PricingSheetParams } from '../BasePricingSheet';

export enum PaymentPricingSheetRowCategory {
  Item = 'ITEM',
  Payment = 'PAYMENT',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
}

interface Calculation<Category> {
  amount: number;
  category: Category;
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
  meta?: any;
}

export type PaymentPricingCalculation =
  Calculation<PaymentPricingSheetRowCategory>;

export const PaymentPricingSheet = (
  params: PricingSheetParams<PaymentPricingCalculation>
) => {
  const basePricingSheet = BasePricingSheet<
    PaymentPricingSheetRowCategory,
    PaymentPricingCalculation
  >(params);

  const pricingSheet = {
    ...basePricingSheet,
    addFee({ amount, isTaxable, isNetPrice, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingSheetRowCategory.Payment,
        amount,
        isTaxable,
        isNetPrice,
        meta,
      });
    },

    addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingSheetRowCategory.Discount,
        amount,
        isTaxable,
        isNetPrice,
        discountId,
        meta,
      });
    },

    addTax({ amount, rate, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingSheetRowCategory.Tax,
        amount,
        isTaxable: false,
        isNetPrice: false,
        rate,
        meta,
      });
    },

    taxSum() {
      return basePricingSheet.sum({
        category: PaymentPricingSheetRowCategory.Tax,
      });
    },

    feeSum() {
      return basePricingSheet.sum({
        category: PaymentPricingSheetRowCategory.Payment,
      });
    },

    discountSum(discountId: string) {
      return basePricingSheet.sum({
        category: PaymentPricingSheetRowCategory.Discount,
        discountId,
      });
    },

    discountPrices(explicitDiscountId: string) {
      const discountIds = pricingSheet
        .getDiscountRows(explicitDiscountId)
        .map(({ discountId }) => discountId);

      return [...new Set(discountIds)]
        .map((discountId) => {
          const amount = basePricingSheet.sum({
            category: PaymentPricingSheetRowCategory.Discount,
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

    getFeeRows() {
      return basePricingSheet.filterBy({
        category: PaymentPricingSheetRowCategory.Item,
      });
    },

    getDiscountRows(discountId: string) {
      return basePricingSheet.filterBy({
        category: PaymentPricingSheetRowCategory.Discount,
        discountId,
      });
    },

    getTaxRows() {
      return basePricingSheet.filterBy({
        category: PaymentPricingSheetRowCategory.Tax,
      });
    },
  };

  return pricingSheet;
};
