import { Order } from '@unchainedshop/types/orders';
import {
  IOrderPricingAdapter,
  IOrderPricingDirector,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  OrderPricingContext,
} from '@unchainedshop/types/orders.pricing';
import { BasePricingDirector } from 'meteor/unchained:utils';
import { OrderPricingSheet } from './OrderPricingSheet';

const baseDirector = BasePricingDirector<
  OrderPricingContext,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingAdapter
>('OrderPricingDirector');

export const OrderPricingDirector: IOrderPricingDirector = {
  ...baseDirector,

  buildPricingContext: async ({ order }: { order: Order }, requestContext) => {
    const { modules } = requestContext;
    const user = await modules.users.findUserById(order.userId);

    const orderPositions = await modules.orders.positions.findOrderPositions({
      orderId: order._id,
    });

    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });

    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });

    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: order._id,
    });

    return {
      currency: order.currency,
      discounts,
      order,
      orderDelivery,
      orderPositions,
      orderPayment,
      user,
      ...requestContext,
    };
  },

  actions: async (pricingContext, requestContext) => {
    return baseDirector.actions(
      pricingContext,
      requestContext,
      OrderPricingDirector.buildPricingContext,
    );
  },

  resultSheet() {
    const pricingSheet = OrderPricingSheet({
      calculation: baseDirector.getCalculation(),
      currency: baseDirector.getContext().currency,
    });

    return pricingSheet;
  },
};
