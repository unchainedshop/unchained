import { Order, OrderTransformations } from '@unchainedshop/types/orders.js';
import { mongodb } from '@unchainedshop/mongodb';
import { OrderPricingSheet } from '../director/OrderPricingSheet.js';

export const configureOrderModuleTransformations = ({
  Orders,
}: {
  Orders: mongodb.Collection<Order>;
}): OrderTransformations => {
  return {
    discounted: async (order, orderDiscount, unchainedAPI) => {
      const { modules } = unchainedAPI;

      // Delivery discounts
      const orderDelivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });
      const orderDeliveryDiscounts = modules.orders.deliveries.discounts(
        orderDelivery,
        { order, orderDiscount },
        unchainedAPI,
      );

      // Payment discounts
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      });
      const orderPaymentDiscounts = modules.orders.payments.discounts(
        orderPayment,
        { order, orderDiscount },
        unchainedAPI,
      );

      // Position discounts
      const orderPositions = await modules.orders.positions.findOrderPositions({
        orderId: order._id,
      });
      const orderPositionDiscounts = orderPositions.flatMap((orderPosition) =>
        modules.orders.positions.discounts(orderPosition, { order, orderDiscount }, unchainedAPI),
      );

      // order discounts
      const pricingSheet = OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      });

      const orderDiscounts = pricingSheet
        .discountPrices(orderDiscount._id)
        .map((discount) => ({ order, ...discount }));

      // All discounts
      const discounted = [
        ...orderPaymentDiscounts,
        ...orderDeliveryDiscounts,
        ...orderPositionDiscounts,
        ...orderDiscounts,
      ].filter(Boolean);

      return discounted;
    },

    discountTotal: async (order, orderDiscount, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const orderDiscountId = orderDiscount._id;

      // Delivery discounts
      const orderDelivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });
      const orderDeliveryDiscountSum =
        orderDelivery &&
        modules.orders.deliveries
          .pricingSheet(orderDelivery, order.currency, unchainedAPI)
          .discountSum(orderDiscountId);

      // Payment discounts
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      });
      const orderPaymentDiscountSum =
        orderPayment &&
        modules.orders.payments
          .pricingSheet(orderPayment, order.currency, unchainedAPI)
          .discountSum(orderDiscountId);

      // Position discounts
      const orderPositions = await modules.orders.positions.findOrderPositions({
        orderId: order._id,
      });
      const orderPositionDiscounts = orderPositions.map((orderPosition) =>
        modules.orders.positions
          .pricingSheet(orderPosition, order.currency, unchainedAPI)
          .discountSum(orderDiscountId),
      );

      // order discounts
      const orderDiscountSum = OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      }).discountSum(orderDiscountId);

      const prices = [
        orderDeliveryDiscountSum,
        orderPaymentDiscountSum,
        ...orderPositionDiscounts,
        orderDiscountSum,
      ];
      const amount = prices.reduce((oldValue, price) => oldValue + (price || 0), 0);
      return {
        amount,
        currency: order.currency,
      };
    },

    isCart: (order) => {
      return order.status === null;
    },
    cart: async ({ orderNumber, countryContext }, user) => {
      const selector: mongodb.Filter<Order> = {
        countryCode: countryContext || user.lastLogin.countryCode,
        status: { $eq: null },
        userId: user._id,
      };

      if (orderNumber) {
        selector.orderNumber = orderNumber;
      }

      const options: mongodb.FindOptions = {
        sort: {
          updated: -1,
        },
      };
      return Orders.findOne(selector, options);
    },

    pricingSheet: (order) => {
      return OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      });
    },
  };
};
