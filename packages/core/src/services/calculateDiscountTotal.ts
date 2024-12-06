import { DeliveryPricingRowCategory, DeliveryPricingSheet } from '../directors/index.js';
import { ProductPricingRowCategory, ProductPricingSheet } from '@unchainedshop/core-products';
import {
  Order,
  OrderDiscount,
  OrderPricingRowCategory,
  OrderPricingSheet,
} from '@unchainedshop/core-orders';
import { PaymentPricingRowCategory, PaymentPricingSheet } from '../directors/PaymentPricingSheet.js';
import { Modules } from '../modules.js';

export const calculateDiscountTotalService = async (
  order: Order,
  orderDiscount: OrderDiscount,
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  const orderDiscountId = orderDiscount._id;

  // Delivery discounts
  const orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId,
  });
  const orderDeliveryDiscountSum = DeliveryPricingSheet({
    calculation: orderDelivery.calculation || [],
    currency: order.currency,
  }).total({ category: DeliveryPricingRowCategory.Discount, discountId: orderDiscountId });

  // Payment discounts
  const orderPayment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId,
  });
  const orderPaymentDiscountSum = PaymentPricingSheet({
    calculation: orderPayment.calculation || [],
    currency: order.currency,
  }).total({ category: PaymentPricingRowCategory.Discount, discountId: orderDiscountId });

  // Position discounts
  const orderPositions = await modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });
  const orderPositionDiscounts = orderPositions.map((orderPosition) =>
    ProductPricingSheet({
      calculation: orderPosition.calculation || [],
      currency: order.currency,
      quantity: orderPosition.quantity,
    }).total({
      category: ProductPricingRowCategory.Discount,
      discountId: orderDiscountId,
    }),
  );

  // order discounts
  const orderDiscountSum = OrderPricingSheet({
    calculation: order.calculation,
    currency: order.currency,
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
    currency: order.currency,
  };
};
