import { Order, OrderDiscount } from '../types.js';
import { OrderPricingSheet } from '../director/OrderPricingSheet.js';
import { OrderPricingDiscount } from '../director/OrderPricingDirector.js';

export interface OrderTransformations {
  discounted: (
    order: Order,
    orderDiscount: OrderDiscount,
    unchainedAPI,
  ) => Promise<Array<OrderPricingDiscount>>;
}

export const configureOrderModuleTransformations = (): OrderTransformations => {
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
  };
};
