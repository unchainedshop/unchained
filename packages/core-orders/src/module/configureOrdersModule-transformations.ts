import { Order } from '../types.js';
import { mongodb } from '@unchainedshop/mongodb';
import { DeliveryPricingRowCategory } from '@unchainedshop/types/delivery.pricing.js';
import { PaymentPricingRowCategory } from '@unchainedshop/types/payments.pricing.js';
import { ProductPricingRowCategory } from '@unchainedshop/types/products.pricing.js';
import {
  IOrderPricingSheet,
  OrderPrice,
  OrderPricingDiscount,
  OrderPricingRowCategory,
} from '@unchainedshop/types/orders.pricing.js';
import { OrderPricingSheet } from '../director/OrderPricingSheet.js';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';

export interface OrderTransformations {
  discounted: (
    order: Order,
    orderDiscount: OrderDiscount,
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<OrderPricingDiscount>>;
  discountTotal: (
    order: Order,
    orderDiscount: OrderDiscount,
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPrice>;

  isCart: (order: Order) => boolean;
  cart: (order: { countryContext?: string; orderNumber?: string; userId: string }) => Promise<Order>;
  pricingSheet: (order: Order) => IOrderPricingSheet;
}

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
          .total({ category: DeliveryPricingRowCategory.Discount, discountId: orderDiscountId });

      // Payment discounts
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      });
      const orderPaymentDiscountSum =
        orderPayment &&
        modules.orders.payments
          .pricingSheet(orderPayment, order.currency, unchainedAPI)
          .total({ category: PaymentPricingRowCategory.Discount, discountId: orderDiscountId });

      // Position discounts
      const orderPositions = await modules.orders.positions.findOrderPositions({
        orderId: order._id,
      });
      const orderPositionDiscounts = orderPositions.map((orderPosition) =>
        modules.orders.positions
          .pricingSheet(orderPosition, order.currency, unchainedAPI)
          .total({ category: ProductPricingRowCategory.Discount, discountId: orderDiscountId }),
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
    },

    isCart: (order) => {
      return order.status === null;
    },
    cart: async ({ orderNumber, countryContext, userId }) => {
      const selector: mongodb.Filter<Order> = {
        countryCode: countryContext,
        status: { $eq: null },
        userId,
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
