import { BasePricingSheet } from 'meteor/unchained:utils';
import {
  DeliveryPricingCalculation,
  DeliveryPricingRowCategory,
  IDeliveryPricingSheet,
  PricingSheetParams,
} from '@unchainedshop/types/pricing';

export const DeliveryPricingSheet = (
  params: PricingSheetParams<DeliveryPricingCalculation>
): IDeliveryPricingSheet => {
  const basePricingSheet = BasePricingSheet<DeliveryPricingCalculation>(params);

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

    taxSum() {
      return basePricingSheet.sum({
        category: DeliveryPricingRowCategory.Tax,
      });
    },

    feeSum() {
      return basePricingSheet.sum({
        category: DeliveryPricingRowCategory.Delivery,
      });
    },

    discountSum(discountId: string) {
      return basePricingSheet.sum({
        category: DeliveryPricingRowCategory.Discount,
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
            category: DeliveryPricingRowCategory.Discount,
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
        category: DeliveryPricingRowCategory.Item,
      });
    },

    getDiscountRows(discountId: string) {
      return basePricingSheet.filterBy({
        category: DeliveryPricingRowCategory.Discount,
        discountId,
      });
    },

    getTaxRows() {
      return basePricingSheet.filterBy({
        category: DeliveryPricingRowCategory.Tax,
      });
    },
  };

  return pricingSheet;
};
