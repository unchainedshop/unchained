import {
  OrderPricingAdapter,
  OrderPricingDirector,
  IOrderPricingAdapter,
  OrderPricingRowCategory,
} from '@unchainedshop/core';

interface PriceRoundSettings {
  defaultPrecision: number;
  roundTo: (value: number, precision: number, currencyCode: string) => number;
}

export const OrderPriceRound: IOrderPricingAdapter & {
  configure: (params: PriceRoundSettings) => void;
  settings: PriceRoundSettings;
} = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-round',
  version: '1.0.0',
  label: 'Round order price to the next precision number',
  orderIndex: 90,

  isActivatedFor: () => {
    return true;
  },

  settings: {
    defaultPrecision: 5,
    roundTo: (value: number, precision: number) =>
      precision !== 0 ? Math.round(value / precision) * precision : value,
  },

  configure({ defaultPrecision, roundTo }) {
    if (defaultPrecision) this.settings.defaultPrecision = defaultPrecision;
    if (roundTo) this.settings.roundTo = roundTo;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);

    const calculateDifference = (amount: number, currencyCode: string) => {
      const roundedAmount = OrderPriceRound.settings.roundTo(
        amount,
        OrderPriceRound.settings.defaultPrecision,
        currencyCode,
      );
      return roundedAmount - amount;
    };

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { currencyCode } = params.context;

        const { amount: deliveryAmount } = params.calculationSheet.total({
          category: OrderPricingRowCategory.Delivery,
          useNetPrice: true,
        });
        if (deliveryAmount) {
          pricingAdapter.resultSheet().addDelivery({
            amount: calculateDifference(deliveryAmount, currencyCode),
            taxAmount: 0,
            meta: {
              adapter: OrderPriceRound.key,
            },
          });
        }

        const { amount: discountAmount } = params.calculationSheet.total({
          category: OrderPricingRowCategory.Discounts,
          useNetPrice: true,
        });
        if (discountAmount) {
          pricingAdapter.resultSheet().addDiscount({
            amount: calculateDifference(discountAmount, currencyCode),
            taxAmount: 0,
            meta: {
              adapter: OrderPriceRound.key,
            },
            discountId: null,
          });
        }

        const { amount: itemsAmount } = params.calculationSheet.total({
          category: OrderPricingRowCategory.Items,
          useNetPrice: true,
        });
        if (itemsAmount) {
          pricingAdapter.resultSheet().addItems({
            amount: calculateDifference(itemsAmount, currencyCode),
            taxAmount: 0,
            meta: {
              adapter: OrderPriceRound.key,
            },
          });
        }

        const { amount: paymentAmount } = params.calculationSheet.total({
          category: OrderPricingRowCategory.Payment,
          useNetPrice: true,
        });
        if (paymentAmount) {
          pricingAdapter.resultSheet().addPayment({
            amount: calculateDifference(paymentAmount, currencyCode),
            taxAmount: 0,
            meta: {
              adapter: OrderPriceRound.key,
            },
          });
        }

        const taxesAmount = params.calculationSheet.taxSum({
          category: OrderPricingRowCategory.Taxes,
        });
        if (taxesAmount) {
          const taxDifference = calculateDifference(taxesAmount, currencyCode);
          pricingAdapter.resultSheet().calculation.push({
            category: OrderPricingRowCategory.Taxes,
            amount: taxDifference,
            meta: {
              adapter: OrderPriceRound.key,
            },
          });
          // WORKAROUND BECAUSE ORDER TOTAL GROSS PRICE IS CALCULATED WITH A SUM OF EVERYTHING EXCEPT TAXES
          // AS OF UNCHAINED <= 2.6
          pricingAdapter.resultSheet().calculation.push({
            category: null,
            amount: taxDifference,
            meta: {
              adapter: OrderPriceRound.key,
            },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderPriceRound);
