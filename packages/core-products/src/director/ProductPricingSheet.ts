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

    addItem({ amount, isTaxable, isNetPrice, meta }) {
      basePricingSheet.calculation.push({
        category: ProductPricingRowCategory.Item,
        amount,
        isTaxable,
        isNetPrice,
        meta,
      });
    },

    addTax({ amount, baseCategory, rate, meta, discountId }) {
      basePricingSheet.calculation.push({
        category: ProductPricingRowCategory.Tax,
        baseCategory,
        discountId,
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

    discountSum(discountId) {
      return basePricingSheet.sum({
        category: ProductPricingRowCategory.Discount,
        discountId,
      });
    },

    unitPrice(unitPriceParams) {
      const amount = unitPriceParams?.useNetPrice ? this.net() : this.gross();
      return {
        amount: Math.round(amount / this.quantity),
        currency: this.currency,
      };
    },

    discountPrices(explicitDiscountId) {
      const discountIds = pricingSheet
        .filterBy({
          category: ProductPricingRowCategory.Discount,
          discountId: explicitDiscountId,
        })
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
  };

  return pricingSheet;
};
