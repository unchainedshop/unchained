import {
  Order,
  OrderDiscount,
  OrderPricingDiscount,
  OrderPricingSheet,
} from '@unchainedshop/core-orders';
import { DeliveryPricingSheet, PaymentPricingSheet, ProductPricingSheet } from '../directors/index.js';
import { Modules } from '../modules.js';

export const discountedEntitiesService = async (
  order: Order,
  orderDiscount: OrderDiscount,
  unchainedAPI: {
    modules: Modules;
  },
): Promise<Array<OrderPricingDiscount>> => {
  const { modules } = unchainedAPI;

  // Delivery discounts
  const orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId,
  });

  const deliveryPricingSheet = DeliveryPricingSheet({
    calculation: orderDelivery.calculation || [],
    currency: order.currency,
  });
  const orderDeliveryDiscounts = deliveryPricingSheet
    .discountPrices(orderDiscount._id)
    .map((discount) => ({
      delivery: orderDelivery,
      ...discount,
    }));

  // Payment discounts
  const orderPayment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId,
  });
  const paymentPricingSheet = PaymentPricingSheet({
    calculation: orderPayment.calculation || [],
    currency: order.currency,
  });
  const orderPaymentDiscounts = paymentPricingSheet
    .discountPrices(orderDiscount._id)
    .map((discount) => ({
      payment: orderPayment,
      ...discount,
    }));

  // Position discounts
  const orderPositions = await modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });
  const orderPositionDiscounts = orderPositions.flatMap((orderPosition) =>
    ProductPricingSheet({
      calculation: orderPosition.calculation,
      currency: order.currency,
      quantity: orderPosition.quantity,
    })
      .discountPrices(orderDiscount._id)
      .map((discount) => ({
        item: orderPosition,
        ...discount,
      })),
  );

  // order discounts
  const orderDiscounts = OrderPricingSheet({
    calculation: order.calculation || [],
    currency: order.currency,
  })
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
};
