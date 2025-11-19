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

const calculateDifference = (amount: number, currencyCode: string) => {
  const roundedAmount = OrderPriceRound.settings.roundTo(
    amount,
    OrderPriceRound.settings.defaultPrecision,
    currencyCode,
  );
  return roundedAmount - amount;
};

export const OrderPriceRound: IOrderPricingAdapter & {
  configure: (params: PriceRoundSettings) => void;
  settings: PriceRoundSettings;
} = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-round-fixed',
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

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { currencyCode } = params.context;

        if (!currencyCode) return pricingAdapter.calculate();

        const { amount: deliveryAmount } = params.calculationSheet.total({
          category: OrderPricingRowCategory.Delivery,
          useNetPrice: true,
        });
        if (deliveryAmount) {
          const taxes = params.calculationSheet.taxSum({
            baseCategory: OrderPricingRowCategory.Delivery,
          });
          const deliveryTaxRate = taxes / deliveryAmount;
          const deliveryDifference = calculateDifference(deliveryAmount, currencyCode);
          pricingAdapter.resultSheet().addDelivery({
            amount: deliveryDifference,
            taxAmount: deliveryTaxRate * deliveryDifference,
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
          const taxes = params.calculationSheet.taxSum({
            baseCategory: OrderPricingRowCategory.Discounts,
          });
          const discountTaxRate = taxes / discountAmount;
          const discountsDifference = calculateDifference(discountAmount, currencyCode);

          pricingAdapter.resultSheet().addDiscount({
            amount: discountsDifference,
            taxAmount: discountsDifference * discountTaxRate,
            meta: {
              adapter: OrderPriceRound.key,
            },
            // @ts-expect-error discountId has to miss
            discountId: null,
          });
        }

        const { amount: itemsAmount } = params.calculationSheet.total({
          category: OrderPricingRowCategory.Items,
          useNetPrice: true,
        });
        if (itemsAmount) {
          const taxes = params.calculationSheet.taxSum({
            baseCategory: OrderPricingRowCategory.Items,
          });
          const itemTaxRate = taxes / itemsAmount;
          const itemsDifference = calculateDifference(itemsAmount, currencyCode);
          pricingAdapter.resultSheet().addItems({
            amount: itemsDifference,
            taxAmount: itemsDifference * itemTaxRate,
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
          const taxes = params.calculationSheet.taxSum({
            baseCategory: OrderPricingRowCategory.Payment,
          });
          const paymentTaxRate = taxes / paymentAmount;
          const paymentsDifference = calculateDifference(paymentAmount, currencyCode);

          pricingAdapter.resultSheet().addPayment({
            amount: paymentsDifference,
            taxAmount: paymentsDifference * paymentTaxRate,
            meta: {
              adapter: OrderPriceRound.key,
            },
          });
        }

        // We need to consider added taxes from above calculations
        // plus the prior taxes that are already on record
        const priorTaxesAmount = params.calculationSheet.taxSum({
          category: OrderPricingRowCategory.Taxes,
        });
        const additionalRoundedTaxes = pricingAdapter.resultSheet().taxSum({
          category: OrderPricingRowCategory.Taxes,
        });
        const taxesAmount = priorTaxesAmount + additionalRoundedTaxes;
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
            category: null as any as string,
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
