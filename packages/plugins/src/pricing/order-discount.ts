import { IOrderPricingAdapter, OrderPricingRowCategory } from '@unchainedshop/types/orders.pricing.js';
import { OrderPricingDirector, OrderPricingAdapter } from '@unchainedshop/core-orders';
import { calculation as calcUtils } from '@unchainedshop/utils';

export const OrderDiscount: IOrderPricingAdapter = {
  ...OrderPricingAdapter,

  key: 'shop.unchained.pricing.order-discount',
  version: '1.0.0',
  label: 'Apply Discounts on Total Order Value',
  orderIndex: 90,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = OrderPricingAdapter.actions(params);
    const { order, orderDelivery, orderPositions, orderPayment, modules } = params.context;

    return {
      ...pricingAdapter,

      calculate: async () => {
        // discounts need to provide a *fixedRate*
        // if you want to add percentual discounts,
        // add it to the order item calculation
        const totalAmountOfItems = params.calculationSheet.sum({
          category: OrderPricingRowCategory.Items,
        });
        const totalAmountOfPaymentAndDelivery =
          params.calculationSheet.sum({
            category: OrderPricingRowCategory.Payment,
          }) +
          params.calculationSheet.sum({
            category: OrderPricingRowCategory.Delivery,
          });

        const itemShares = orderPositions.map((orderPosition) =>
          calcUtils.resolveRatioAndTaxDivisorForPricingSheet(
            modules.orders.positions.pricingSheet(orderPosition, order.currency, params.context),
            totalAmountOfItems,
          ),
        );

        const deliveryShare = calcUtils.resolveRatioAndTaxDivisorForPricingSheet(
          orderDelivery &&
            modules.orders.deliveries.pricingSheet(orderDelivery, order.currency, params.context),
          totalAmountOfPaymentAndDelivery,
        );
        const paymentShare = calcUtils.resolveRatioAndTaxDivisorForPricingSheet(
          orderPayment &&
            modules.orders.payments.pricingSheet(orderPayment, order.currency, params.context),
          totalAmountOfPaymentAndDelivery,
        );

        let amountLeft = totalAmountOfPaymentAndDelivery + totalAmountOfItems;

        params.discounts.forEach(({ configuration, discountId }) => {
          // First, we deduce the discount from the items
          let alreadyDeducted = 0;

          const leftInDiscountToSplit = calcUtils.calculateAmountToSplit(
            { ...configuration, alreadyDeducted },
            totalAmountOfItems,
          );
          const [itemsDiscountAmount, itemsTaxAmount] = calcUtils.applyDiscountToMultipleShares(
            itemShares,
            Math.max(0, Math.min(amountLeft, leftInDiscountToSplit)),
          );
          amountLeft -= itemsDiscountAmount;
          alreadyDeducted += itemsDiscountAmount;

          // After the items, we deduct the remaining discount from payment & delivery fees
          const leftInFeesToSplit = calcUtils.calculateAmountToSplit(
            { ...configuration, alreadyDeducted },
            totalAmountOfPaymentAndDelivery,
          );
          const [deliveryAndPaymentDiscountAmount, deliveryAndPaymentTaxAmount] =
            calcUtils.applyDiscountToMultipleShares(
              [deliveryShare, paymentShare],
              Math.max(0, Math.min(amountLeft, leftInFeesToSplit)),
            );
          amountLeft -= deliveryAndPaymentDiscountAmount;
          alreadyDeducted += itemsDiscountAmount;

          const discountAmount = (itemsDiscountAmount + deliveryAndPaymentDiscountAmount) * -1;
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
