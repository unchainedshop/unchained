import { BasePricingSheet, PricingSheetParams } from '../BasePricingSheet';

export enum ProductPricingSheetRowCategory {
  Item = 'ITEM',
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

export type ProductPricingCalculation =
  Calculation<ProductPricingSheetRowCategory>;

export const ProductPricingSheet = (
  params: PricingSheetParams<ProductPricingCalculation>
) => {
  const basePricingSheet = BasePricingSheet<
    ProductPricingSheetRowCategory,
    ProductPricingCalculation
  >(params);

  const pricingSheet = {
    ...basePricingSheet,

    addItem({ amount, isTaxable, isNetPrice, meta }) {
      basePricingSheet.calculation.push({
        category: ProductPricingSheetRowCategory.Item,
        amount,
        isTaxable,
        isNetPrice,
        meta,
      });
    },

    addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: ProductPricingSheetRowCategory.Discount,
        amount,
        isTaxable,
        isNetPrice,
        discountId,
        meta,
      });
    },

    addTax({ amount, rate, meta }) {
      basePricingSheet.calculation.push({
        category: ProductPricingSheetRowCategory.Tax,
        amount,
        isTaxable: false,
        isNetPrice: false,
        rate,
        meta,
      });
    },

    taxSum() {
      return basePricingSheet.sum({
        category: ProductPricingSheetRowCategory.Tax,
      });
    },

    itemSum() {
      return basePricingSheet.sum({
        category: ProductPricingSheetRowCategory.Item,
      });
    },

    discountSum(discountId: string) {
      return basePricingSheet.sum({
        category: ProductPricingSheetRowCategory.Discount,
        discountId,
      });
    },

    unitPrice({ useNetPrice = false } = {}) {
      const amount = useNetPrice ? this.net() : this.gross();
      return {
        amount: Math.round(amount / this.quantity),
        currency: this.currency,
      };
    },

    discountPrices(explicitDiscountId: string) {
      const discountIds = pricingSheet
        .getDiscountRows(explicitDiscountId)
        .map(({ discountId }) => discountId);

      return [...new Set(discountIds)]
        .map((discountId) => {
          const amount = basePricingSheet.sum({
            category: ProductPricingSheetRowCategory.Discount,
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

    getItemRows() {
      return basePricingSheet.filterBy({
        category: ProductPricingSheetRowCategory.Item,
      });
    },

    getDiscountRows(discountId: string) {
      return basePricingSheet.filterBy({
        category: ProductPricingSheetRowCategory.Discount,
        discountId,
      });
    },

    getTaxRows() {
      return basePricingSheet.filterBy({
        category: ProductPricingSheetRowCategory.Tax,
      });
    },
  };

  return pricingSheet;
};
