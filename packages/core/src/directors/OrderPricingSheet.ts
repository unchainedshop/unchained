import {
  BasePricingSheet,
  IPricingSheet,
  IBasePricingSheet,
  PricingCalculation,
  PricingSheetParams,
} from '@unchainedshop/utils';

export interface OrderPricingCalculation extends PricingCalculation {
  discountId?: string;
}

export enum OrderPricingRowCategory {
  Items = 'ITEMS',
  Discounts = 'DISCOUNTS',
  Taxes = 'TAXES',
  Delivery = 'DELIVERY',
  Payment = 'PAYMENT',
}

export interface IOrderPricingSheet extends IPricingSheet<OrderPricingCalculation> {
  addDelivery: (params: { amount: number; taxAmount: number; meta?: any }) => void;
  addDiscount: (params: { amount: number; taxAmount: number; discountId: string; meta?: any }) => void;
  addItems: (params: { amount: number; taxAmount: number; meta?: any }) => void;
  addPayment: (params: { amount: number; taxAmount: number; meta?: any }) => void;
}

export const OrderPricingSheet = (
  params: PricingSheetParams<OrderPricingCalculation>,
): IOrderPricingSheet => {
  const basePricingSheet: IBasePricingSheet<OrderPricingCalculation> = BasePricingSheet(params);

  const addTaxIfAvailabile = (category: string, taxAmount?: number, meta?: any, discountId?: string) => {
    if (taxAmount) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Taxes,
        amount: taxAmount,
        baseCategory: category,
        discountId,
        meta,
      });
    }
  };

  const pricingSheet: IOrderPricingSheet = {
    ...basePricingSheet,

    addItems({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Items,
        amount,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Items, taxAmount, meta);
    },

    addDiscount({ amount, taxAmount, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Discounts,
        amount,
        discountId,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Discounts, taxAmount, meta, discountId);
    },

    addDelivery({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Delivery,
        amount,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Delivery, taxAmount, meta);
    },

    addPayment({ amount, taxAmount, meta }) {
      basePricingSheet.calculation.push({
        category: OrderPricingRowCategory.Payment,
        amount,
        meta,
      });

      addTaxIfAvailabile(OrderPricingRowCategory.Payment, taxAmount, meta);
    },

    taxSum(filter) {
      return basePricingSheet.sum({
        category: OrderPricingRowCategory.Taxes,
        ...(filter || {}),
      });
    },

    gross() {
      // tax is included 2 times, this is only true for Order Pricing!
      return basePricingSheet.sum() - this.taxSum();
    },

    net() {
      return basePricingSheet.sum() - this.taxSum() - this.taxSum();
    },

    total({ category, useNetPrice, discountId } = { useNetPrice: false }) {
      const taxAmount = this.taxSum({ baseCategory: category, discountId });
      const amount = this.sum({ category, discountId }) - taxAmount;

      // Sum does not contain taxes when filtering by category, it's net in that case and gross if there is no category
      const netAmount = !category ? amount - taxAmount : amount;

      return {
        amount: Math.round(useNetPrice ? netAmount : netAmount + taxAmount),
        currency: this.currency,
      };
    },

    discountPrices(explicitDiscountId) {
      const discountIds = pricingSheet
        .filterBy({
          category: OrderPricingRowCategory.Discounts,
          discountId: explicitDiscountId,
        })
        .map(({ discountId }) => discountId);

      return [...new Set(discountIds)]
        .map((discountId) => {
          const amount = basePricingSheet.sum({
            category: OrderPricingRowCategory.Discounts,
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
