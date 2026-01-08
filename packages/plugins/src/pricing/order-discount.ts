import {
  type IOrderPricingAdapter,
  OrderPricingRowCategory,
  OrderPricingDirector,
  OrderPricingAdapter,
  type OrderDiscountConfiguration,
  DeliveryPricingSheet,
  PaymentPricingSheet,
  ProductPricingSheet,
  resolveRatioAndTaxDivisorForPricingSheet,
} from '@unchainedshop/core';
import { calculation as calcUtils } from '@unchainedshop/utils';

export const OrderDiscount: IOrderPricingAdapter<OrderDiscountConfiguration> = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-discount',
  version: '1.0.0',
  label: 'Apply Discounts on Total Order Value',
  orderIndex: 40,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    const { order, orderDelivery, orderPositions, orderPayment } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        if (!order) return pricingAdapter.calculate();

        const totalAmountOfItems = params.calculationSheet.total({
          category: OrderPricingRowCategory.Items,
          useNetPrice: false,
        }).amount;
        const totalAmountOfPaymentAndDelivery =
          params.calculationSheet.total({
            category: OrderPricingRowCategory.Payment,
            useNetPrice: false,
          }).amount +
          params.calculationSheet.total({
            category: OrderPricingRowCategory.Delivery,
            useNetPrice: false,
          }).amount;
        const itemShares = orderPositions.map((orderPosition) =>
          resolveRatioAndTaxDivisorForPricingSheet(
            ProductPricingSheet({
              calculation: orderPosition.calculation,
              currencyCode: order.currencyCode,
              quantity: orderPosition.quantity,
            }),
            totalAmountOfItems,
          ),
        );

        const deliveryShare = resolveRatioAndTaxDivisorForPricingSheet(
          DeliveryPricingSheet({
            calculation: orderDelivery?.calculation || [],
            currencyCode: order.currencyCode,
          }),
          totalAmountOfPaymentAndDelivery,
        );

        const paymentShare = resolveRatioAndTaxDivisorForPricingSheet(
          PaymentPricingSheet({
            calculation: orderPayment?.calculation || [],
            currencyCode: order.currencyCode,
          }),
          totalAmountOfPaymentAndDelivery,
        );
        let amountLeft = totalAmountOfPaymentAndDelivery + totalAmountOfItems;
        params.discounts.forEach(({ configuration, discountId }) => {
          // First, we deduce the discount from the items
          const leftInDiscountToSplit = calcUtils.calculateAmountToSplit(
            { ...configuration },
            Math.min(totalAmountOfItems, amountLeft),
          );
          const [itemsDiscountAmount, itemsTaxAmount] = calcUtils.applyDiscountToMultipleShares(
            itemShares,
            Math.max(0, Math.min(amountLeft, leftInDiscountToSplit)),
          );
          amountLeft -= itemsDiscountAmount;

          // If it's a fixed rate we need to deduct the already deducted amount from the fixed rate
          // before we hand it over to the split calculation
          const fixedRate =
            Number(configuration.fixedRate) > 0
              ? Math.max(0, configuration.fixedRate! - itemsDiscountAmount)
              : undefined;
          const leftInFeesToSplit = calcUtils.calculateAmountToSplit(
            { ...configuration, fixedRate },
            Math.min(totalAmountOfPaymentAndDelivery, amountLeft),
          );
          const [deliveryAndPaymentDiscountAmount, deliveryAndPaymentTaxAmount] =
            calcUtils.applyDiscountToMultipleShares(
              [deliveryShare, paymentShare],
              Math.max(0, Math.min(amountLeft, leftInFeesToSplit)),
            );
          amountLeft -= deliveryAndPaymentDiscountAmount;
          const discountAmount =
            (itemsDiscountAmount +
              deliveryAndPaymentDiscountAmount -
              itemsTaxAmount -
              deliveryAndPaymentTaxAmount) *
            -1;
          const taxAmount = (itemsTaxAmount + deliveryAndPaymentTaxAmount) * -1;
          if (discountAmount) {
            pricingAdapter.resultSheet().addDiscount({
              amount: discountAmount,
              taxAmount,
              discountId,
              meta: {
                adapter: OrderDiscount.key,
              },
            });
          }
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

OrderPricingDirector.registerAdapter(OrderDiscount);
