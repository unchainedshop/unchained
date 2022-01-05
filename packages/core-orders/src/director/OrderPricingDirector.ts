import { Order } from '@unchainedshop/types/orders';
import {
  IOrderPricingAdapter,
  IOrderPricingDirector,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  OrderPricingContext,
} from '@unchainedshop/types/orders.pricing';
import { BasePricingDirector, dbIdToString } from 'meteor/unchained:utils';
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
    const user = await modules.users.findUser({
      userId: order.userId,
    });

    const orderId = dbIdToString(order._id);

    const orderPositions = await modules.orders.positions.findOrderPositions({
      orderId,
    });

    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });

    const orderPayment = await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    });

    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId,
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

  resultSheet() {
    const pricingSheet = OrderPricingSheet({
      calculation: baseDirector.getCalculation(),
      currency: baseDirector.getContext().order.currency,
    });

    return pricingSheet;
  },
};
