import { BasePricingSheet, PricingSheetParams } from '../basePricing/BasePricingSheet';

export enum DeliveryPricingSheetRowCategory {
  Delivery = 'DELIVERY',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
  Item = 'ITEM', // Propably unused
}

interface Calculation<Category> {
  amount: number;
  category: Category;
  discountId?: string;
  isNetPrice: boolean;
  isTaxable: boolean;
  meta?: any;
  rate?: number;
}

export type DeliveryPricingCalculation =
  Calculation<DeliveryPricingSheetRowCategory>;

export const DeliveryPricingSheet = (
  params: PricingSheetParams<DeliveryPricingCalculation>
) => {
  const basePricingSheet = BasePricingSheet<
    DeliveryPricingSheetRowCategory,
    DeliveryPricingCalculation
  >(params);

  const pricingSheet = {
    ...basePricingSheet,
    addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: DeliveryPricingSheetRowCategory.Discount,
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
        category: DeliveryPricingSheetRowCategory.Delivery,
        isNetPrice,
        isTaxable,
        meta,
      });
    },

    addTax({ amount, rate, meta }) {
      basePricingSheet.calculation.push({
        amount,
        category: DeliveryPricingSheetRowCategory.Tax,
        isNetPrice: false,
        isTaxable: false,
        meta,
        rate,
      });
    },

    taxSum() {
      return basePricingSheet.sum({
        category: DeliveryPricingSheetRowCategory.Tax,
      });
    },

    feeSum() {
      return basePricingSheet.sum({
        category: DeliveryPricingSheetRowCategory.Delivery,
      });
    },

    discountSum(discountId: string) {
      return basePricingSheet.sum({
        category: DeliveryPricingSheetRowCategory.Discount,
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
            category: DeliveryPricingSheetRowCategory.Discount,
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
        category: DeliveryPricingSheetRowCategory.Item,
      });
    },

    getDiscountRows(discountId: string) {
      return basePricingSheet.filterBy({
        category: DeliveryPricingSheetRowCategory.Discount,
        discountId,
      });
    },

    getTaxRows() {
      return basePricingSheet.filterBy({
        category: DeliveryPricingSheetRowCategory.Tax,
      });
    },
  };

  return pricingSheet;
};
