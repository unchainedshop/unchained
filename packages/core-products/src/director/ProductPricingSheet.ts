import { BasePricingSheet } from '@unchainedshop/utils';
import {
  ProductPricingCalculation,
  ProductPricingRowCategory,
  IProductPricingSheet,
} from '@unchainedshop/types/products.pricing.js';
import { PricingSheetParams } from '@unchainedshop/types/pricing.js';

export const ProductPricingSheet = (
  params: PricingSheetParams<ProductPricingCalculation>,
): IProductPricingSheet => {
  const basePricingSheet = BasePricingSheet<ProductPricingCalculation>(params);

  const pricingSheet: IProductPricingSheet = {
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

    discountSum(discountId) {
      return basePricingSheet.sum({
        category: ProductPricingRowCategory.Discount,
        discountId,
      });
    },

    unitPrice(unitPriceParams) {
      const netAmount = this.net();
      const grossAmount = this.gross();
      return {
        amount: Math.round((unitPriceParams?.useNetPrice ? netAmount : grossAmount) / this.quantity),
        currency: this.currency,
        isNetPrice: unitPriceParams?.useNetPrice,
        isTaxable: grossAmount !== netAmount,
        category: ProductPricingRowCategory.Item,
      };
    },

    discountPrices(explicitDiscountId) {
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
