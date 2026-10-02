import type { Price, PricingCalculation } from '@unchainedshop/utils';

import {
  BasePricingSheet,
  type IPricingSheet,
  type PricingDiscount,
  type PricingSheetParams,
} from './BasePricingSheet.ts';

export interface ProductPricingCalculation extends PricingCalculation {
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
}

export const ProductPricingRowCategory = {
  Item: 'ITEM',
  Discount: 'DISCOUNT',
  Tax: 'TAX',
} as const;

export type ProductPricingRowCategory =
  (typeof ProductPricingRowCategory)[keyof typeof ProductPricingRowCategory];

export interface IProductPricingSheet extends IPricingSheet<ProductPricingCalculation> {
  addItem: (params: Omit<ProductPricingCalculation, 'category' | 'discountId'>) => void;

  addTax: (params: {
    amount: number;
    rate: number;
    baseCategory?: string;
    discountId?: string;
    meta?: any;
  }) => void;

  addDiscount: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    discountId: string;
    meta?: any;
  }) => void;

  unitPrice: (params: { useNetPrice?: boolean }) => Price;
}

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

    taxSum(filter) {
      return basePricingSheet.sum({
        category: ProductPricingRowCategory.Tax,
        ...(filter || {}),
      });
    },

    unitPrice(unitPriceParams) {
      const amount = unitPriceParams?.useNetPrice ? this.net() : this.gross();
      return {
        amount: Math.round(amount / (this.quantity ?? 1)),
        currencyCode: this.currencyCode,
      };
    },

    discountPrices(explicitDiscountId) {
      const discountIds = pricingSheet
        .filterBy({
          category: ProductPricingRowCategory.Discount,
          discountId: explicitDiscountId,
        })
        .map(({ discountId }) => discountId)
        .filter(Boolean) as string[];

      return [...new Set(discountIds)]
        .map((discountId) => {
          // gross: the discount rows plus the tax attributed to the discount
          const taxAmount = pricingSheet.taxSum({
            baseCategory: ProductPricingRowCategory.Discount,
            discountId,
          });
          const amount =
            pricingSheet.sum({ category: ProductPricingRowCategory.Discount, discountId }) + taxAmount;
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
