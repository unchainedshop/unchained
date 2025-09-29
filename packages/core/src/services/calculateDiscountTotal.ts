import { Order, OrderDiscount } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';
import {
  OrderPricingRowCategory,
  OrderPricingSheet,
  DeliveryPricingRowCategory,
  DeliveryPricingSheet,
  ProductPricingRowCategory,
  ProductPricingSheet,
  PaymentPricingRowCategory,
  PaymentPricingSheet,
} from '../directors/index.js';

export async function calculateDiscountTotalService(
  this: Modules,
  order: Order,
  orderDiscount: OrderDiscount,
) {
  const orderDiscountId = orderDiscount._id;

  // Delivery discounts
  const orderDelivery = await this.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId!,
  });
  const orderDeliveryDiscountSum = DeliveryPricingSheet({
    calculation: orderDelivery?.calculation || [],
    currencyCode: order.currencyCode,
  }).total({ category: DeliveryPricingRowCategory.Discount, discountId: orderDiscountId });

  // Payment discounts
  const orderPayment = await this.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId!,
  });
  const orderPaymentDiscountSum = PaymentPricingSheet({
    calculation: orderPayment?.calculation || [],
    currencyCode: order.currencyCode,
  }).total({ category: PaymentPricingRowCategory.Discount, discountId: orderDiscountId });

  // Position discounts
  const orderPositions = await this.orders.positions.findOrderPositions({
    orderId: order._id,
  });
  const orderPositionDiscounts = orderPositions.map((orderPosition) =>
    ProductPricingSheet({
      calculation: orderPosition.calculation || [],
      currencyCode: order.currencyCode,
      quantity: orderPosition.quantity,
    }).total({
      category: ProductPricingRowCategory.Discount,
      discountId: orderDiscountId,
    }),
  );

  // order discounts
  const orderDiscountSum = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  }).total({ category: OrderPricingRowCategory.Discounts, discountId: orderDiscountId });

  const prices = [
    orderDeliveryDiscountSum.amount,
    orderPaymentDiscountSum.amount,
    ...orderPositionDiscounts.map((positionDiscount) => positionDiscount.amount),
    orderDiscountSum.amount,
  ];
  const amount = prices.reduce((oldValue, price) => oldValue + (price || 0), 0);
  return {
    amount,
    currencyCode: order.currencyCode,
  };
}
