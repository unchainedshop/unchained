import { BasePricingSheet } from 'meteor/unchained:utils';
import {
  ProductPricingCalculation,
  ProductPricingRowCategory,
  IProductPricingSheet,
} from '@unchainedshop/types/products.pricing';
import { PricingSheetParams } from '@unchainedshop/types/pricing';

export const ProductPricingSheet = (
  params: PricingSheetParams<ProductPricingCalculation>,
): IProductPricingSheet => {
  const basePricingSheet = BasePricingSheet<ProductPricingCalculation>(params);

  const pricingSheet = {
    ...basePricingSheet,

    addItem({ amount, isTaxable, isNetPrice, meta }) {
      basePricingSheet.calculation.push({
        category: ProductPricingRowCategory.Item,
        amount,
        isTaxable,
        isNetPrice,
        meta,
      });
    },

    addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: ProductPricingRowCategory.Discount,
        amount,
        isTaxable,
        isNetPrice,
        discountId,
        meta,
      });
    },

    addTax({ amount, rate, meta }) {
      basePricingSheet.calculation.push({
        category: ProductPricingRowCategory.Tax,
        amount,
        isTaxable: false,
        isNetPrice: false,
        rate,
        meta,
      });
    },

    taxSum() {
      return basePricingSheet.sum({
        category: ProductPricingRowCategory.Tax,
      });
    },

    itemSum() {
      return basePricingSheet.sum({
        category: ProductPricingRowCategory.Item,
      });
    },

    discountSum(discountId: string) {
      return basePricingSheet.sum({
        category: ProductPricingRowCategory.Discount,
        discountId,
      });
    },

    unitPrice({ useNetPrice = false } = {}) {
      const netAmount = this.net();
      const grossAmount = this.gross();
      return {
        amount: Math.round((useNetPrice ? netAmount : grossAmount) / this.quantity),
        currency: this.currency,
        isNetPrice: useNetPrice,
        isTaxable: grossAmount !== netAmount,
      };
    },

    discountPrices(explicitDiscountId: string) {
      const discountIds = pricingSheet
        .getDiscountRows(explicitDiscountId)
        .map(({ discountId }) => discountId);

      return [...new Set(discountIds)]
        .map((discountId) => {
          const amount = basePricingSheet.sum({
            category: ProductPricingRowCategory.Discount,
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
        category: ProductPricingRowCategory.Item,
      });
    },

    getDiscountRows(discountId: string) {
      return basePricingSheet.filterBy({
        category: ProductPricingRowCategory.Discount,
        discountId,
      });
    },

    getTaxRows() {
      return basePricingSheet.filterBy({
        category: ProductPricingRowCategory.Tax,
      });
    },
  };

  return pricingSheet;
};
